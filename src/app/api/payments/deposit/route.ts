import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking, Payment } from "@/lib/db/models";
import { config } from "@/lib/config";
import { getStripe, isStripeConfigured } from "@/lib/payments/stripe";

const bodySchema = z.object({
  bookingId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 },
      );
    }

    const { bookingId } = bodySchema.parse(await req.json());
    await connectDb();

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== "held") {
      return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
    }

    const amount = booking.paymentSummary?.depositCents ?? 0;
    if (amount <= 0) {
      return NextResponse.json({ error: "No deposit due" }, { status: 400 });
    }

    const stripe = getStripe();
    const payment = await Payment.create({
      bookingId: booking._id,
      kind: "deposit",
      method: "stripe",
      amountCents: amount,
      status: "pending",
    });

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "cad",
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: String(booking._id),
        paymentId: String(payment._id),
        kind: "deposit",
      },
      receipt_email: booking.guest?.email,
    });

    payment.stripePaymentIntentId = intent.id;
    await payment.save();

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      publishableKey: config.stripePublishableKey,
      amountCents: amount,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error("[Stripe Deposit Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create deposit intent" },
      { status: 500 }
    );
  }
}
