import { NextResponse } from "next/server";
import { addHours, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking, Client, Coupon, Payment, Service } from "@/lib/db/models";
import { assertSlotFree } from "@/lib/booking/availability";
import { expireStaleHolds } from "@/lib/booking/holds";
import { applyDiscount } from "@/lib/money";
import { config } from "@/lib/config";
import { getSession } from "@/lib/auth/jwt";
import { AuthError, requireManager } from "@/lib/auth/jwt";
import { notifyAdminsOfBooking } from "@/lib/mailgun/notifications";
import { findOrCreateClientForGuest } from "@/lib/booking/clientResolver";

const createSchema = z.object({
	serviceId: z.string().min(1),
	start: z.string().datetime(),
	depositMethod: z.enum(["stripe", "etransfer", "cash", "other"]).optional(),
	status: z.enum(["held", "confirmed", "completed", "cancelled"]).optional(),
	guest: z
		.object({
			name: z.string().min(1),
			email: z.string().email(),
			phone: z.string().optional(),
		})
		.optional(),
	couponCode: z.string().optional(),
	referralCode: z.string().optional(),
	notes: z.string().optional(),
	clientId: z.string().optional(),
});

export async function GET(req: Request) {
	try {
		await expireStaleHolds();
		await connectDb();
		const { searchParams } = new URL(req.url);
		const scope = searchParams.get("scope");

		if (scope === "admin") {
			await requireManager();
			const startParam = searchParams.get("start");
			const endParam = searchParams.get("end");

			const query: any = {};
			if (startParam || endParam) {
				query.start = {};
				if (startParam) query.start.$gte = new Date(startParam);
				if (endParam) query.start.$lte = new Date(endParam);
			}

			let q = Booking.find(query).populate("serviceId");
			if (startParam || endParam) {
				q = q.sort({ start: 1 });
			} else {
				q = q.sort({ start: -1 }).limit(100);
			}
			const bookings = await q;
			return NextResponse.json({ bookings });
		}

		const session = await getSession();
		if (!session || session.role !== "client") {
			return NextResponse.json({ bookings: [] });
		}

		const bookings = await Booking.find({ clientId: session.sub }).sort({ start: -1 }).populate("serviceId");
		return NextResponse.json({ bookings });
	} catch (err) {
		if (err instanceof AuthError) {
			return NextResponse.json({ error: err.message }, { status: err.status });
		}
		console.error(err);
		return NextResponse.json({ error: "Failed to list bookings" }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		await expireStaleHolds();
		const body = createSchema.parse(await req.json());
		await connectDb();

		const service = await Service.findById(body.serviceId);
		if (!service || !service.active) {
			return NextResponse.json({ error: "Service not found" }, { status: 404 });
		}

		const start = new Date(body.start);
		const end = new Date(start.getTime() + service.durationMin * 60_000);

		// Assert slot is free. Managers can override/book conflicts if needed, but standard is slot free.
		await assertSlotFree(start, end);

		const session = await getSession();
		const isManager = session?.role === "manager";

		let guest = body.guest ?? null;
		let clientId = body.clientId ?? null;

		if (session?.role === "client") {
			clientId = session.sub;
			if (!guest) {
				guest = {
					name: session.name,
					email: session.email,
					phone: "",
				};
			}
		}

		if (!guest && body.clientId) {
			const client = await Client.findById(body.clientId);
			if (client) {
				guest = {
					name: client.name,
					email: client.email,
					phone: client.phone || "",
				};
				clientId = String(client._id);
			}
		}

		if (!guest) {
			return NextResponse.json({ error: "Guest details are required" }, { status: 400 });
		}

		// Automatically link or create Client document for guest in Clients collection
		const resolvedClient = await findOrCreateClientForGuest(guest);
		if (resolvedClient) {
			clientId = String(resolvedClient._id);
		}

		// Enforce booking limits on clients (1/day, 2/week, 5/month)
		if (!isManager) {
			const clientFilter: any = {
				status: { $ne: "cancelled" }
			};
			if (clientId) {
				clientFilter.$or = [
					{ clientId },
					{ "guest.email": guest.email }
				];
			} else {
				clientFilter["guest.email"] = guest.email;
			}

			// 1. Same day limit
			const dayStart = startOfDay(start);
			const dayEnd = endOfDay(start);
			const sameDayCount = await Booking.countDocuments({
				...clientFilter,
				start: { $gte: dayStart, $lte: dayEnd }
			});
			if (sameDayCount >= 1) {
				return NextResponse.json(
					{ error: "You already have a booking scheduled for this day." },
					{ status: 400 }
				);
			}

			// 2. Same week limit
			const weekStart = startOfWeek(start);
			const weekEnd = endOfWeek(start);
			const sameWeekCount = await Booking.countDocuments({
				...clientFilter,
				start: { $gte: weekStart, $lte: weekEnd }
			});
			if (sameWeekCount >= 2) {
				return NextResponse.json(
					{ error: "Limit exceeded: Maximum of 2 bookings allowed per week." },
					{ status: 400 }
				);
			}

			// 3. Same month limit
			const monthStart = startOfMonth(start);
			const monthEnd = endOfMonth(start);
			const sameMonthCount = await Booking.countDocuments({
				...clientFilter,
				start: { $gte: monthStart, $lte: monthEnd }
			});
			if (sameMonthCount >= 5) {
				return NextResponse.json(
					{ error: "Limit exceeded: Maximum of 5 bookings allowed per month." },
					{ status: 400 }
				);
			}
		}

		if (!isManager && !body.depositMethod) {
			return NextResponse.json({ error: "Deposit method is required" }, { status: 400 });
		}

		const status = body.status ?? "held";
		const depositMethod = body.depositMethod ?? (isManager ? "cash" : "etransfer");
		const isStripe = depositMethod === "stripe";

		let priceCents = service.priceCents;
		let discountCents = 0;
		let couponId = null;

		if (body.couponCode) {
			const cleanCode = body.couponCode.toUpperCase().trim();

			// 1. Try finding a Discount Coupon
			const coupon = await Coupon.findOne({
				code: cleanCode,
				active: true,
			});

			if (
				coupon &&
				(!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) &&
				(coupon.maxRedemptions == null || coupon.redemptionCount < coupon.maxRedemptions)
			) {
				const discounted = applyDiscount(priceCents, coupon.type, coupon.value);
				discountCents = priceCents - discounted;
				priceCents = discounted;
				couponId = coupon._id;

				// Increment redemption count
				coupon.redemptionCount = (coupon.redemptionCount || 0) + 1;
				await coupon.save();
			} else {
				// 2. Try finding a Digital Gift Card
				const { GiftCard } = await import("@/lib/db/models/GiftCard");
				const giftCard = await GiftCard.findOne({
					code: cleanCode,
					active: true,
				});

				if (
					giftCard &&
					(!giftCard.expiryDate || new Date(giftCard.expiryDate) > new Date()) &&
					giftCard.remainingBalanceCents > 0
				) {
					const availableCents = giftCard.remainingBalanceCents;
					discountCents = Math.min(availableCents, priceCents);
					priceCents = priceCents - discountCents;

					// Deduct from gift card balance
					giftCard.remainingBalanceCents = Math.max(0, giftCard.remainingBalanceCents - discountCents);
					await giftCard.save();
				}
			}
		}

		const depositCents = Math.min(service.depositCents, priceCents);

		// If the booking is manually confirmed by a manager, count deposit as paid immediately
		const isConfirmed = status === "confirmed" || status === "completed";
		const paidCents = isConfirmed ? depositCents : 0;
		const balanceDueCents = priceCents - paidCents;

		let holdExpiresAt = null;
		if (status === "held" && depositMethod === "etransfer") {
			holdExpiresAt = addHours(new Date(), config.holdExpiryHours);
		}

		const booking = await Booking.create({
			clientId,
			guest,
			serviceId: service._id,
			start,
			end,
			status,
			holdExpiresAt,
			depositMethod,
			couponId,
			referralCode: body.referralCode ?? "",
			notes: body.notes ?? "",
			paymentSummary: {
				totalCents: service.priceCents,
				depositCents,
				paidCents,
				tipCents: 0,
				discountCents,
				balanceDueCents,
			},
		});

		if (isConfirmed && depositCents > 0) {
			await Payment.create({
				bookingId: booking._id,
				kind: "deposit",
				method: depositMethod,
				amountCents: depositCents,
				status: "succeeded",
				note: `Manual booking created by manager ${session?.name || ""}`,
			});
		} else if (status === "held" && depositMethod === "etransfer") {
			await Payment.create({
				bookingId: booking._id,
				kind: "deposit",
				method: "etransfer",
				amountCents: depositCents,
				status: "pending",
				note: "Awaiting Interac e-Transfer proof",
			});
		}

		// Trigger asynchronous admin notification email with .ics calendar file
		void notifyAdminsOfBooking({
			bookingId: String(booking._id),
			eventType: isConfirmed ? "deposit_paid" : "creation",
		});

		return NextResponse.json({
			booking,
			next: isConfirmed
				? { action: "none", message: "Booking confirmed successfully" }
				: isStripe
					? { action: "pay_stripe_deposit" }
					: {
							action: "upload_etransfer_proof",
							holdExpiresAt: booking.holdExpiresAt,
							message: "Send Interac e-Transfer for the deposit, then upload proof. Your slot is held for 2 hours.",
						},
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
		}
		console.error(err);
		return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create booking" }, { status: 400 });
	}
}
