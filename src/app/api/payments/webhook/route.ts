import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { Booking, Payment } from "@/lib/db/models";
import { config } from "@/lib/config";
import { getStripe } from "@/lib/payments/stripe";
import type Stripe from "stripe";

async function applySucceededPayment(meta: {
  bookingId?: string;
  paymentId?: string;
  kind?: string;
}) {
  if (!meta.bookingId || !meta.paymentId) return;

  await connectDb();
  const payment = await Payment.findById(meta.paymentId);
  const booking = await Booking.findById(meta.bookingId);
  if (!payment || !booking) return;

  payment.status = "succeeded";
  payment.confirmedAt = new Date();
  await payment.save();

  const summary = booking.paymentSummary ?? {
    totalCents: 0,
    depositCents: 0,
    paidCents: 0,
    tipCents: 0,
    discountCents: 0,
    balanceDueCents: 0,
  };

  if (meta.kind === "tip") {
    summary.tipCents = (summary.tipCents ?? 0) + payment.amountCents;
  } else {
    summary.paidCents = (summary.paidCents ?? 0) + payment.amountCents;
    summary.balanceDueCents = Math.max(
      0,
      (summary.totalCents ?? 0) -
        (summary.discountCents ?? 0) -
        summary.paidCents,
    );
  }

  booking.paymentSummary = summary;

  if (meta.kind === "deposit") {
    booking.status = "confirmed";
    booking.holdExpiresAt = null;
  }

  await booking.save();
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (!config.stripeWebhookSecret) {
      // Dev fallback: parse JSON without verification
      event = JSON.parse(body) as Stripe.Event;
    } else {
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
      }
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        config.stripeWebhookSecret,
      );
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await applySucceededPayment({
          bookingId: intent.metadata?.bookingId,
          paymentId: intent.metadata?.paymentId,
          kind: intent.metadata?.kind,
        });
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await applySucceededPayment({
          bookingId: session.metadata?.bookingId,
          paymentId: session.metadata?.paymentId,
          kind: session.metadata?.kind,
        });
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
