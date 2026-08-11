import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking, Payment } from "@/lib/db/models";
import { config, getAppUrl } from "@/lib/config";
import { getStripe, isStripeConfigured } from "@/lib/payments/stripe";

const bodySchema = z.object({
  bookingId: z.string().min(1),
  amountCents: z.number().int().positive(),
});

export async function POST(req: Request) {
  try {
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

    const stripe = getStripe();
    const payment = await Payment.create({
      bookingId: booking._id,
      kind: "tip",
      method: "stripe",
      amountCents: body.amountCents,
      status: "pending",
    });

    const baseUrl = getAppUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/book/success?bookingId=${booking._id}&paid=tip`,
      cancel_url: `${baseUrl}/book/success?bookingId=${booking._id}`,
      customer_email: booking.guest?.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: body.amountCents,
            product_data: {
              name: "Tip for Mari Esthetics",
            },
          },
        },
      ],
      metadata: {
        bookingId: String(booking._id),
        paymentId: String(payment._id),
        kind: "tip",
      },
    });

    payment.stripeCheckoutSessionId = session.id;
    await payment.save();

    return NextResponse.json({ url: session.url, paymentId: payment._id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create tip link" }, { status: 500 });
  }
}
