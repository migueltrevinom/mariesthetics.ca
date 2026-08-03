import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { StripePaymentLink } from "@/lib/db/models/StripePaymentLink";
import { getStripe } from "@/lib/payments/stripe";
import { Booking, Payment } from "@/lib/db/models";
import { notifyAdminsOfBooking } from "@/lib/mailgun/notifications";
import "@/lib/db/models/Service";

export const dynamic = "force-dynamic";

/**
 * Helper function to sync booking status and recalculate paid balance when a Stripe checkout session is completed.
 */
async function syncBookingOnPaidSession(bookingId: string, amountPaid: number): Promise<any> {
	const currentBooking = await Booking.findById(bookingId);
	if (!currentBooking) return null;

	let updated = false;

	// Confirm held status if necessary
	if (currentBooking.status === "held") {
		currentBooking.status = "confirmed";
		currentBooking.holdExpiresAt = null;
		updated = true;
	}

	const summary = currentBooking.paymentSummary ?? {
		totalCents: 0,
		depositCents: 0,
		paidCents: 0,
		tipCents: 0,
		discountCents: 0,
		balanceDueCents: 0,
	};

	// Recalculate total paid from all succeeded payments for this booking
	const succeededPayments = await Payment.find({
		bookingId: currentBooking._id,
		status: "succeeded",
	});
	const totalSucceededCents = succeededPayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);
	const newPaidCents = Math.max(summary.paidCents, totalSucceededCents, amountPaid);

	if (summary.paidCents !== newPaidCents) {
		summary.paidCents = newPaidCents;
		summary.balanceDueCents = Math.max(
			0,
			(summary.totalCents ?? 0) - (summary.discountCents ?? 0) - summary.paidCents
		);
		currentBooking.paymentSummary = summary;
		updated = true;
	}

	if (updated) {
		await currentBooking.save();

		// Notify admins of deposit payment confirmation with attached .ics file
		void notifyAdminsOfBooking({
			bookingId: String(currentBooking._id),
			eventType: "deposit_paid",
		});
	}

	return Booking.findById(bookingId).populate("serviceId").lean();
}

/**
 * Helper sub-function to auto-sync StripePaymentLink, Payment record, and Booking models when a Checkout session is paid.
 */
async function syncPaidCheckoutSession(params: {
	sessionId: string;
	session: any;
	link: any;
	paymentRecord: any;
	booking: any;
}): Promise<{ link: any; paymentRecord: any; booking: any }> {
	const { sessionId, session, link, paymentRecord, booking } = params;
	let updatedLink = link;
	let updatedPaymentRecord = paymentRecord;
	let updatedBooking = booking;

	// 1. Sync StripePaymentLink if present
	if (updatedLink && updatedLink.status !== "paid") {
		await StripePaymentLink.findOneAndUpdate(
			{ stripeSessionId: sessionId },
			{ $set: { status: "paid", paidAt: new Date() } }
		);
		updatedLink = { ...updatedLink, status: "paid" };
	}

	// 2. Sync Payment record if present
	if (updatedPaymentRecord && updatedPaymentRecord.status !== "succeeded") {
		await Payment.findByIdAndUpdate(updatedPaymentRecord._id, {
			$set: { status: "succeeded" },
		});
		updatedPaymentRecord = { ...updatedPaymentRecord, status: "succeeded" };
	}

	// 3. Sync Booking status and paymentSummary if present via side function
	if (updatedBooking) {
		const amountPaid = session?.amount_total || updatedPaymentRecord?.amountCents || updatedLink?.amountCents || 0;
		const syncedBooking = await syncBookingOnPaidSession(updatedBooking._id, amountPaid);
		if (syncedBooking) {
			updatedBooking = syncedBooking;
		}
	}

	return { link: updatedLink, paymentRecord: updatedPaymentRecord, booking: updatedBooking };
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const sessionId = searchParams.get("session_id");
		const bookingIdParam = searchParams.get("bookingId");
		const paymentIdParam = searchParams.get("paymentId");

		await connectDb();

		const stripe = getStripe();
		let session: any = null;
		if (sessionId) {
			try {
				session = await stripe.checkout.sessions.retrieve(sessionId);
			} catch (err: any) {
				console.error("[Stripe Session Retrieve Error]:", err.message);
			}
		}

		// 1. Try finding by StripePaymentLink first
		let link = sessionId
			? await StripePaymentLink.findOne({ stripeSessionId: sessionId })
					.populate({
						path: "bookingId",
						populate: { path: "serviceId" },
					})
					.lean()
			: null;

		// 2. If not a StripePaymentLink, check if linked to a direct Booking/Payment
		let booking: any = null;
		let paymentRecord: any = null;

		const targetBookingId = link?.bookingId?._id || link?.bookingId || session?.metadata?.bookingId || bookingIdParam;
		const targetPaymentId = session?.metadata?.paymentId || paymentIdParam;

		if (targetBookingId) {
			booking = await Booking.findById(targetBookingId).populate("serviceId").lean();
		}

		if (targetPaymentId) {
			paymentRecord = await Payment.findById(targetPaymentId).lean();
		} else if (sessionId) {
			paymentRecord = await Payment.findOne({ stripeCheckoutSessionId: sessionId }).lean();
		}

		// If session is paid, auto-sync database states via side sub-function
		if (session && session.payment_status === "paid") {
			const synced = await syncPaidCheckoutSession({
				sessionId: sessionId!,
				session,
				link,
				paymentRecord,
				booking,
			});
			link = synced.link;
			paymentRecord = synced.paymentRecord;
			booking = synced.booking;
		}

		// Retrieve payment method details
		let paymentMethodDetails = "Stripe / Card";
		if (session?.payment_intent) {
			try {
				const paymentIntent = await stripe.paymentIntents.retrieve(String(session.payment_intent));
				if (paymentIntent.payment_method) {
					const method = await stripe.paymentMethods.retrieve(String(paymentIntent.payment_method));
					if (method.card) {
						paymentMethodDetails = `${method.card.brand.toUpperCase()} ···· ${method.card.last4}`;
					}
				}
			} catch (e) {
				// ignore
			}
		} else if (booking?.depositMethod === "etransfer") {
			paymentMethodDetails = "Interac e-Transfer";
		}

		const serviceObj = booking?.serviceId;
		const amountCents = session?.amount_total || paymentRecord?.amountCents || link?.amountCents || booking?.paymentSummary?.depositCents || 0;

		return NextResponse.json({
			paymentStatus: session?.payment_status || paymentRecord?.status || (booking?.status === "confirmed" ? "paid" : "pending"),
			sessionStatus: session?.status || "complete",
			paymentMethod: paymentMethodDetails,
			receipt: {
				id: String(link?._id || paymentRecord?._id || booking?._id || "RECEIPT"),
				amountCents,
				description: link?.description || (serviceObj ? `${serviceObj.name} — Reservation Deposit` : "Esthetics Treatment Deposit"),
				kind: link?.kind || paymentRecord?.kind || "deposit",
				clientEmail: link?.clientEmail || booking?.guest?.email || session?.customer_details?.email || "",
				createdAt: link?.createdAt ? new Date(link.createdAt).toISOString() : paymentRecord?.createdAt ? new Date(paymentRecord.createdAt).toISOString() : new Date().toISOString(),
				bookingDate: booking?.start ? new Date(booking.start).toISOString() : null,
				bookingServiceName: serviceObj?.name || null,
			},
			booking: booking ? {
				id: String(booking._id),
				start: booking.start ? new Date(booking.start).toISOString() : null,
				end: booking.end ? new Date(booking.end).toISOString() : null,
				status: booking.status,
				guestName: booking.guest?.name || "",
				guestEmail: booking.guest?.email || "",
				guestPhone: booking.guest?.phone || "",
				serviceName: serviceObj?.name || "",
				durationMin: serviceObj?.durationMin || 60,
				totalCents: booking.paymentSummary?.totalCents || serviceObj?.priceCents || 0,
				depositCents: booking.paymentSummary?.depositCents || amountCents,
				paidCents: booking.paymentSummary?.paidCents || amountCents,
				balanceDueCents: booking.paymentSummary?.balanceDueCents || 0,
			} : null,
			provider: {
				name: "Marinelle Tala",
				businessName: "Mari Esthetics",
				address: "1211 Gillespie Crescent NW, Edmonton, AB",
				email: "mari@mariesthetics.ca",
				phone: "+1 (780) 555-0199",
			},
		});
	} catch (err: any) {
		console.error("Failed to load checkout session details", err);
		return NextResponse.json(
			{ error: err.message || "Failed to retrieve payment receipt details" },
			{ status: 500 }
		);
	}
}
