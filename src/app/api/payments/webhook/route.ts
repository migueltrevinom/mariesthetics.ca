import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { Booking, Payment } from "@/lib/db/models";
import { config } from "@/lib/config";
import { getStripe } from "@/lib/payments/stripe";
import type Stripe from "stripe";
import { notifyAdminsOfBooking, notifyClientOfBooking } from "@/lib/mailgun/notifications";
import { markStudioChargePaid } from "@/lib/payments/studioCharge";

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

  const succeededPayments = await Payment.find({
    bookingId: booking._id,
    status: "succeeded",
  });
  const nonTipSucceeded = succeededPayments
    .filter((p) => p.kind !== "tip")
    .reduce((sum, p) => sum + (p.amountCents || 0), 0);
  const tipSucceeded = succeededPayments
    .filter((p) => p.kind === "tip")
    .reduce((sum, p) => sum + (p.amountCents || 0), 0);

  const netServicePrice = Math.max(0, (summary.totalCents ?? 0) - (summary.discountCents ?? 0));
  const totalAll = succeededPayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);
  const impliedTip = Math.max(0, totalAll - netServicePrice);

  summary.tipCents = Math.max(summary.tipCents ?? 0, tipSucceeded, impliedTip);
  const rawPaid = Math.max(summary.paidCents ?? 0, nonTipSucceeded);
  summary.paidCents = netServicePrice > 0 ? Math.min(netServicePrice, rawPaid) : rawPaid;
  summary.balanceDueCents = Math.max(0, netServicePrice - summary.paidCents);

  booking.paymentSummary = summary;

  if (meta.kind === "deposit") {
    booking.status = "confirmed";
    booking.holdExpiresAt = null;
  }

  await booking.save();

  const eventType =
    meta.kind === "deposit"
      ? "deposit_paid"
      : meta.kind === "balance"
        ? "balance_paid"
        : meta.kind === "tip" || meta.kind === "custom"
          ? "payment_paid"
          : null;

  if (eventType) {
    void notifyAdminsOfBooking({
      bookingId: String(booking._id),
      eventType,
      chargeCents: payment.amountCents,
    });
    void notifyClientOfBooking({
      bookingId: String(booking._id),
      kind: meta.kind as any,
      chargeCents: payment.amountCents,
    });
  }
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
        if (intent.metadata?.tipPaymentId) {
          await applySucceededPayment({
            bookingId: intent.metadata?.bookingId,
            paymentId: intent.metadata?.tipPaymentId,
            kind: "tip",
          });
        }
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.kind === "studio_charge" && session.metadata.studioChargeId) {
          await markStudioChargePaid(session.metadata.studioChargeId, session.id);
          break;
        }
        await applySucceededPayment({
          bookingId: session.metadata?.bookingId,
          paymentId: session.metadata?.paymentId,
          kind: session.metadata?.kind,
        });
        if (session.metadata?.tipPaymentId) {
          await applySucceededPayment({
            bookingId: session.metadata?.bookingId,
            paymentId: session.metadata?.tipPaymentId,
            kind: "tip",
          });
        }
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
