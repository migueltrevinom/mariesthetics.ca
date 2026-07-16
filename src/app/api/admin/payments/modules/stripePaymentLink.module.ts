import { StripePaymentLinkRepository } from "../repositories/stripePaymentLink.repository";
import { getStripe } from "@/lib/payments/stripe";

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

	const protocol =
		params.host.includes("localhost") || params.host.includes("127.0.0.1") ? "http" : "https";
	const baseUrl = `${protocol}://${params.host}`;

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
		success_url: `${baseUrl}/admin/payments?success=true&session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${baseUrl}/admin/payments?cancelled=true`,
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
