import { StripePaymentLinkRepository } from "../repositories/stripePaymentLink.repository";
import { getStripe } from "@/lib/payments/stripe";
import { Booking, Payment } from "@/lib/db/models";

export async function getStripePaymentLinks(params: { page: number; limit: number }) {
	const skip = (params.page - 1) * params.limit;
	const links = await StripePaymentLinkRepository.findMany({ limit: params.limit, skip });
	return links;
}

export async function createStripePaymentLink(params: {
	amountCad: number;
	description: string;
	kind: "deposit" | "balance" | "tip" | "custom";
	bookingId?: string;
	clientEmail?: string;
	host: string;
}) {
	const stripe = getStripe();
	const amountCents = Math.round(params.amountCad * 100);

	const isLocalhostHost =
		!params.host || params.host.includes("localhost") || params.host.includes("127.0.0.1");
	const baseUrl =
		isLocalhostHost && (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SITE_URL)
			? (process.env.NEXT_PUBLIC_SITE_URL || "https://mariesthetics.ca").replace(/\/$/, "")
			: `${isLocalhostHost ? "http" : "https"}://${params.host}`;

	// Create stripe checkout session
	const session = await stripe.checkout.sessions.create({
		payment_method_types: ["card"],
		line_items: [
			{
				price_data: {
					currency: "cad",
					product_data: {
						name: `Mari Esthetics - ${params.description}`,
						description: `Payment kind: ${params.kind}`,
					},
					unit_amount: amountCents,
				},
				quantity: 1,
			},
		],
		mode: "payment",
		customer_email: params.clientEmail || undefined,
		metadata: {
			bookingId: params.bookingId || "",
			kind: params.kind,
			description: params.description,
			isCustomPaymentLink: "true",
		},
		success_url: `${baseUrl}/payment-link?success=true&session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${baseUrl}/payment-link?cancelled=true`,
	});

	if (!session.url) {
		throw new Error("Stripe did not return a checkout session URL.");
	}

	// Save record in MongoDB using the repository
	const linkRecord = await StripePaymentLinkRepository.create({
		bookingId: params.bookingId,
		clientEmail: params.clientEmail || "",
		amountCents,
		kind: params.kind,
		description: params.description,
		stripeSessionId: session.id,
		stripePaymentLinkUrl: session.url,
		status: "pending",
	});

	return {
		url: session.url,
		record: linkRecord,
	};
}

export async function syncStripePaymentLink(stripeSessionId: string) {
	const link = await StripePaymentLinkRepository.findBySessionId(stripeSessionId);
	if (!link) {
		throw new Error("Stripe payment link not found in database.");
	}

	const stripe = getStripe();
	const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

	if (session.payment_status === "paid") {
		// Update StripePaymentLink status to paid
		link.status = "paid";
		link.paidAt = new Date();
		await link.save();

		// Check if Payment record already exists
		const stripePaymentIntentId = String(session.payment_intent || "");
		let payment = await Payment.findOne({ stripePaymentIntentId });

		if (!payment) {
			// Create the Payment transaction record
			payment = await Payment.create({
				bookingId: link.bookingId || null,
				kind: link.kind === "custom" ? "adjustment" : link.kind,
				method: "stripe",
				amountCents: link.amountCents,
				status: "succeeded",
				stripePaymentIntentId,
				note: `Stripe Checkout Session ${session.id} manually synced`,
			});

			// If associated with a booking, confirm and update summary
			if (link.bookingId) {
				const booking = await Booking.findById(link.bookingId);
				if (booking) {
					if (booking.status === "held") {
						booking.status = "confirmed";
						booking.holdExpiresAt = null;
					}

					const summary = booking.paymentSummary ?? {
						totalCents: 0,
						depositCents: 0,
						paidCents: 0,
						tipCents: 0,
						discountCents: 0,
						balanceDueCents: 0,
					};

					summary.paidCents = (summary.paidCents ?? 0) + link.amountCents;
					summary.balanceDueCents = Math.max(
						0,
						(summary.totalCents ?? 0) - (summary.discountCents ?? 0) - summary.paidCents
					);
					booking.paymentSummary = summary;
					await booking.save();
				}
			}
		}

		return { status: "paid", link, payment };
	} else if (session.status === "expired") {
		link.status = "expired";
		await link.save();
		return { status: "expired", link };
	}

	return { status: link.status, link };
}
