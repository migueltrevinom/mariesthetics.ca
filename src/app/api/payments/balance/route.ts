import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking, Payment } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";
import { config } from "@/lib/config";
import { getStripe, isStripeConfigured } from "@/lib/payments/stripe";

const bodySchema = z.object({
  bookingId: z.string().min(1),
  amountCents: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  try {
    await requireManager();
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 },
      );
    }

    const body = bodySchema.parse(await req.json());
    await connectDb();

    const booking = await Booking.findById(body.bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const amount =
      body.amountCents ?? booking.paymentSummary?.balanceDueCents ?? 0;
    if (amount <= 0) {
      return NextResponse.json({ error: "No balance due" }, { status: 400 });
    }

    const stripe = getStripe();
    const payment = await Payment.create({
      bookingId: booking._id,
      kind: "balance",
      method: "stripe",
      amountCents: amount,
      status: "pending",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${config.appUrl}/book/success?bookingId=${booking._id}&paid=balance`,
      cancel_url: `${config.appUrl}/admin/bookings`,
      customer_email: booking.guest?.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: amount,
            product_data: {
              name: "Mari Esthetics — remaining balance",
            },
          },
        },
      ],
      metadata: {
        bookingId: String(booking._id),
        paymentId: String(payment._id),
        kind: "balance",
      },
    });

    payment.stripeCheckoutSessionId = session.id;
    await payment.save();

    return NextResponse.json({ url: session.url, paymentId: payment._id });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create balance link" }, { status: 500 });
  }
}
