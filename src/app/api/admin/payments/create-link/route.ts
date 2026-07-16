import { NextResponse } from "next/server";
import { z } from "zod";
import { withManagerAuth } from "@/lib/auth/jwt";
import { withValidation } from "@/app/api/services/middlewares/validation.middleware";
import { getStripe } from "@/lib/payments/stripe";

export const createPaymentLinkSchema = z.object({
	amountCad: z.number().positive("Amount must be greater than zero"),
	description: z.string().min(1, "Description is required"),
	kind: z.enum(["deposit", "balance", "tip", "custom"]),
	bookingId: z.string().optional(),
	clientEmail: z.string().email("Invalid email address").or(z.literal("")).optional(),
});

type CreatePaymentLinkInput = z.infer<typeof createPaymentLinkSchema>;

async function handleCreatePaymentLink(req: Request, validatedData: CreatePaymentLinkInput) {
	try {
		const stripe = getStripe();
		const { amountCad, description, kind, bookingId, clientEmail } = validatedData;

		// Convert amount to cents for Stripe
		const amountCents = Math.round(amountCad * 100);

		// Get host for redirect URLs
		const host = req.headers.get("host") || "localhost:3000";
		const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
		const baseUrl = `${protocol}://${host}`;

		// Build checkout session configuration
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "cad",
						product_data: {
							name: `Mari Esthetics - ${description}`,
							description: `Payment kind: ${kind}`,
						},
						unit_amount: amountCents,
					},
					quantity: 1,
				},
			],
			mode: "payment",
			customer_email: clientEmail || undefined,
			metadata: {
				bookingId: bookingId || "",
				kind,
				description,
				isCustomPaymentLink: "true",
			},
			success_url: `${baseUrl}/admin/payments?success=true&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${baseUrl}/admin/payments?cancelled=true`,
		});

		return NextResponse.json({ url: session.url });
	} catch (err: any) {
		console.error("Failed to create Stripe payment link", err);
		return NextResponse.json(
			{ error: err.message || "Failed to generate Stripe payment link" },
			{ status: 500 }
		);
	}
}

export const POST = withManagerAuth(withValidation(createPaymentLinkSchema, handleCreatePaymentLink));
