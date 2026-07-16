import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { StripePaymentLink } from "@/lib/db/models/StripePaymentLink";
import { getStripe } from "@/lib/payments/stripe";
import "@/lib/db/models/Booking"; // Ensure schema registration
import "@/lib/db/models/Service"; // Ensure schema registration

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const sessionId = searchParams.get("session_id");

		if (!sessionId) {
			return NextResponse.json({ error: "session_id is required" }, { status: 400 });
		}

		await connectDb();

		// Find payment link in MongoDB
		const link = await StripePaymentLink.findOne({ stripeSessionId: sessionId })
			.populate({
				path: "bookingId",
				populate: { path: "serviceId" },
			})
			.lean();

		if (!link) {
			return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
		}

		const stripe = getStripe();
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		// If paid, let's sync status in DB just in case!
		if (session.payment_status === "paid" && link.status !== "paid") {
			await StripePaymentLink.findOneAndUpdate(
				{ stripeSessionId: sessionId },
				{ $set: { status: "paid", paidAt: new Date() } }
			);
			link.status = "paid";
		}

		// Retrieve card/method details from payment intent if available
		let paymentMethodDetails = "Stripe Card";
		try {
			if (session.payment_intent) {
				const paymentIntent = await stripe.paymentIntents.retrieve(String(session.payment_intent));
				if (paymentIntent.payment_method) {
					const method = await stripe.paymentMethods.retrieve(String(paymentIntent.payment_method));
					if (method.card) {
						paymentMethodDetails = `${method.card.brand.toUpperCase()} ···· ${method.card.last4}`;
					}
				}
			}
		} catch (e) {
			console.error("Failed to fetch Stripe payment method details:", e);
		}

		const booking = link.bookingId as any;

		return NextResponse.json({
			paymentStatus: session.payment_status, // "paid" or "unpaid"
			sessionStatus: session.status, // "complete", "expired", "open"
			paymentMethod: paymentMethodDetails,
			receipt: {
				id: String(link._id),
				amountCents: link.amountCents,
				description: link.description,
				kind: link.kind,
				clientEmail: link.clientEmail || session.customer_details?.email || "",
				createdAt: link.createdAt ? new Date(link.createdAt).toISOString() : new Date().toISOString(),
				bookingDate: booking?.start ? new Date(booking.start).toISOString() : null,
				bookingServiceName: booking?.serviceId?.name || null,
			},
			provider: {
				name: "Marinelle Tala",
				businessName: "Mari Esthetics",
				address: "1211 Gillespie Crescent NW",
				email: "mari@mariesthetics.ca",
				phone: "+1 (780) 555-0199", // Canadian business display number
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
