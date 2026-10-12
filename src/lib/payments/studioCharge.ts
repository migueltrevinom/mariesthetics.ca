import { connectDb } from "@/lib/db/connect";
import { StudioCharge } from "@/lib/db/models/StudioCharge";
import { getAppUrl } from "@/lib/config";
import { formatCad } from "@/lib/money";
import { sendEmail } from "@/lib/mailgun";
import { getStripe, isStripeConfigured } from "@/lib/payments/stripe";

export const TIP_OPTIONS = [10, 15, 20, 0] as const;
export type TipPercent = (typeof TIP_OPTIONS)[number];

export function isTipPercent(value: number): value is TipPercent {
  return (TIP_OPTIONS as readonly number[]).includes(value);
}

export function tipCentsFor(baseAmountCents: number, tipPercent: number): number {
  return Math.round((baseAmountCents * tipPercent) / 100);
}

export function publicStudioCharge(charge: {
  _id: unknown;
  baseAmountCents: number;
  tipPercent: number;
  tipCents: number;
  totalCents: number;
  clientName?: string;
  clientEmail?: string;
  description?: string;
  status: string;
  checkoutUrl?: string;
  paidAt?: Date | null;
  createdAt?: Date;
}) {
  return {
    id: String(charge._id),
    baseAmountCents: charge.baseAmountCents,
    tipPercent: charge.tipPercent,
    tipCents: charge.tipCents,
    totalCents: charge.totalCents,
    clientName: charge.clientName || "",
    clientEmail: charge.status === "paid" ? charge.clientEmail || "" : "",
    description: charge.description || "Mari Esthetics",
    status: charge.status,
    checkoutUrl: charge.status === "open" ? charge.checkoutUrl || "" : "",
    paidAt: charge.paidAt ? new Date(charge.paidAt).toISOString() : null,
    createdAt: charge.createdAt ? new Date(charge.createdAt).toISOString() : null,
  };
}

async function expireSession(sessionId: string) {
  if (!sessionId || !isStripeConfigured()) return;
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.status === "open") {
      await stripe.checkout.sessions.expire(sessionId);
    }
  } catch (err) {
    console.warn("[Studio charge] could not expire checkout session", err);
  }
}

export async function openCheckoutForCharge(chargeId: string, req?: Request) {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }

  await connectDb();
  const charge = await StudioCharge.findById(chargeId);
  if (!charge) throw new Error("Charge not found");
  if (charge.status !== "open") throw new Error("This charge is no longer open");

  if (charge.stripeCheckoutSessionId) {
    await expireSession(charge.stripeCheckoutSessionId);
  }

  const stripe = getStripe();
  const baseUrl = getAppUrl(req);
  const description = charge.description || "Mari Esthetics";
  const lineItems: {
    quantity: number;
    price_data: {
      currency: "cad";
      unit_amount: number;
      product_data: { name: string };
    };
  }[] = [
    {
      quantity: 1,
      price_data: {
        currency: "cad",
        unit_amount: charge.baseAmountCents,
        product_data: { name: description },
      },
    },
  ];

  if (charge.tipCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "cad",
        unit_amount: charge.tipCents,
        product_data: { name: `Tip (${charge.tipPercent}%)` },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: charge.clientEmail,
    success_url: `${baseUrl}/pay?paid=1&charge=${charge._id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pay`,
    line_items: lineItems,
    metadata: {
      kind: "studio_charge",
      studioChargeId: String(charge._id),
    },
  });

  charge.stripeCheckoutSessionId = session.id;
  charge.checkoutUrl = session.url || "";
  await charge.save();
  return charge;
}

export async function cancelOpenStudioCharges() {
  await connectDb();
  const openCharges = await StudioCharge.find({ status: "open" });
  for (const charge of openCharges) {
    await expireSession(charge.stripeCheckoutSessionId);
    charge.status = "cancelled";
    charge.checkoutUrl = "";
    await charge.save();
  }
}

export function invoiceHtml(charge: {
  _id: unknown;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  baseAmountCents: number;
  tipPercent: number;
  tipCents: number;
  totalCents: number;
  paidAt?: Date | null;
  createdAt?: Date;
}) {
  const when = charge.paidAt || charge.createdAt || new Date();
  const dateLabel = new Date(when).toLocaleString("en-CA", { timeZone: "America/Edmonton" });
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:32px;background:#f6f3ec;font-family:Georgia,serif;color:#1c1814;">
  <table style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4dccb;border-radius:16px;padding:32px;">
    <tr><td>
      <p style="margin:0;letter-spacing:0.18em;text-transform:uppercase;font-size:12px;color:#8a7040;">Mari Esthetics</p>
      <h1 style="margin:8px 0 0;font-weight:400;font-size:28px;">Invoice</h1>
      <p style="margin:8px 0 24px;color:#665b4e;font-family:sans-serif;font-size:13px;">${dateLabel}<br/>Invoice ${String(charge._id)}</p>
      <p style="font-family:sans-serif;font-size:14px;margin:0 0 16px;">${charge.clientName || "Client"}<br/>${charge.clientEmail || ""}</p>
      <table width="100%" style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">${charge.description || "Mari Esthetics"}</td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #eee;">${formatCad(charge.baseAmountCents)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">Tip (${charge.tipPercent}%)</td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #eee;">${formatCad(charge.tipCents)}</td>
        </tr>
        <tr>
          <td style="padding:14px 0;font-weight:700;">Total paid</td>
          <td align="right" style="padding:14px 0;font-weight:700;">${formatCad(charge.totalCents)}</td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function emailStudioInvoice(chargeId: string) {
  await connectDb();
  const charge = await StudioCharge.findOneAndUpdate(
    { _id: chargeId, status: "paid", invoiceSentAt: null, clientEmail: { $ne: "" } },
    { $set: { invoiceSentAt: new Date() } },
  );
  if (!charge) return;

  const result = await sendEmail({
    to: charge.clientEmail,
    subject: `Invoice from Mari Esthetics — ${formatCad(charge.totalCents)}`,
    html: invoiceHtml(charge),
  });

  if (!result.success) {
    await StudioCharge.updateOne({ _id: chargeId }, { $set: { invoiceSentAt: null } });
  }
}

export async function markStudioChargePaid(chargeId: string, sessionId?: string) {
  await connectDb();
  const charge = await StudioCharge.findById(chargeId);
  if (!charge) return null;
  if (sessionId && charge.stripeCheckoutSessionId && charge.stripeCheckoutSessionId !== sessionId) {
    return charge;
  }
  if (charge.status !== "paid") {
    charge.status = "paid";
    charge.paidAt = new Date();
    charge.checkoutUrl = "";
    await charge.save();
  }
  await emailStudioInvoice(String(charge._id));
  return charge;
}

export async function confirmStudioChargeFromSession(sessionId: string) {
  if (!sessionId || !isStripeConfigured()) return null;
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return null;
  const chargeId = session.metadata?.studioChargeId;
  if (!chargeId || session.metadata?.kind !== "studio_charge") return null;
  return markStudioChargePaid(chargeId, session.id);
}
