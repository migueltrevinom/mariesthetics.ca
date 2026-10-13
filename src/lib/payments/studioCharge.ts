import { signStudioChargeToken } from "@/lib/payments/studioChargeToken";
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

export const MAX_TIP_CHANGES = 10;

export function tipCentsFor(baseAmountCents: number, tipPercent: number): number {
  return Math.round((baseAmountCents * tipPercent) / 100);
}

export function publicStudioCharge(
  charge: {
    _id?: unknown;
    baseAmountCents: number;
    tipPercent: number;
    tipCents: number;
    totalCents: number;
    description?: string;
    status: string;
    checkoutUrl?: string;
    paidAt?: Date | null;
    createdAt?: Date;
    clientName?: string;
    clientEmail?: string;
    stripeCheckoutSessionId?: string;
    bookingId?: unknown;
  },
  booking?: any | null,
  payments?: any[] | null,
) {
  const service = booking?.serviceId;
  const serviceName = service?.name || booking?.serviceName || charge.description || "Esthetics Treatment";
  const durationMin = service?.durationMin || 60;
  const treatmentTotalCents =
    booking?.paymentSummary?.totalCents || service?.priceCents || charge.baseAmountCents;
  const depositPaidCents =
    booking?.paymentSummary?.depositCents ||
    payments?.find((p: any) => p.kind === "deposit")?.amountCents ||
    (treatmentTotalCents > charge.baseAmountCents ? treatmentTotalCents - charge.baseAmountCents : 0);

  const discountCents = booking?.paymentSummary?.discountCents || 0;
  const paidToDateCents =
    charge.status === "paid"
      ? depositPaidCents + charge.totalCents
      : booking?.paymentSummary?.paidCents || depositPaidCents;

  const balanceDueCents =
    charge.status === "paid"
      ? 0
      : Math.max(0, treatmentTotalCents - discountCents - depositPaidCents);
  const chargeIdStr = String(charge._id || "");

  return {
    id: chargeIdStr,
    number: `INV-SC-${chargeIdStr.slice(-8).toUpperCase()}`,
    clientFirstName: (charge.clientName || booking?.guest?.name || "").trim().split(/\s+/)[0] || "Client",
    clientFullName: charge.clientName || booking?.guest?.name || "Client",
    clientEmail: charge.clientEmail || booking?.guest?.email || "",
    clientPhone: booking?.guest?.phone || "",
    baseAmountCents: charge.baseAmountCents,
    tipPercent: charge.tipPercent,
    tipCents: charge.tipCents,
    totalCents: charge.totalCents,
    description: charge.description || serviceName,
    status: charge.status,
    checkoutUrl: charge.status === "open" ? charge.checkoutUrl || "" : "",
    paidAt: charge.paidAt ? new Date(charge.paidAt).toISOString() : null,
    createdAt: charge.createdAt ? new Date(charge.createdAt).toISOString() : null,
    stripeSessionId: charge.stripeCheckoutSessionId || "",
    booking: booking
      ? {
          id: String(booking._id),
          serviceName,
          durationMin,
          servicePriceCents: treatmentTotalCents,
          start: booking.start ? new Date(booking.start).toISOString() : null,
          end: booking.end ? new Date(booking.end).toISOString() : null,
          depositCents: depositPaidCents,
          paidToDateCents,
          balanceDueCents,
          depositMethod: booking.depositMethod || "stripe",
        }
      : null,
    reconciliation: {
      treatmentTotalCents,
      depositPaidCents,
      balancePaidCents: charge.baseAmountCents,
      tipPercent: charge.tipPercent,
      tipCents: charge.tipCents,
      discountCents,
      totalChargedTodayCents: charge.totalCents,
      totalPaidToDateCents: paidToDateCents,
      balanceDueCents,
    },
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
  const payUrl = `${baseUrl}/pay?t=${encodeURIComponent(await signStudioChargeToken(String(charge._id)))}`;
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
    success_url: `${payUrl}&paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: payUrl,
    line_items: lineItems,
    metadata: {
      kind: "studio_charge",
      studioChargeId: String(charge._id),
      bookingId: charge.bookingId ? String(charge.bookingId) : "",
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

export function invoiceHtml(
  charge: {
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
  },
  booking?: any | null,
) {
  const when = charge.paidAt || charge.createdAt || new Date();
  const dateLabel = new Date(when).toLocaleString("en-CA", { timeZone: "America/Edmonton" });
  const serviceName = booking?.serviceId?.name || booking?.serviceName || charge.description || "Esthetics Treatment";
  const durationMin = booking?.serviceId?.durationMin || 60;
  const apptDateStr = booking?.start
    ? new Date(booking.start).toLocaleString("en-CA", { timeZone: "America/Edmonton" })
    : null;

  const treatmentTotalCents = booking?.paymentSummary?.totalCents || booking?.serviceId?.priceCents || charge.baseAmountCents;
  const depositPaidCents =
    booking?.paymentSummary?.depositCents ||
    (treatmentTotalCents > charge.baseAmountCents ? treatmentTotalCents - charge.baseAmountCents : 0);

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:32px 16px;background:#0b100d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f3efe6;">
  <table style="max-width:580px;margin:0 auto;background:#0f1712;border:1px solid rgba(200,168,107,0.3);border-radius:20px;padding:36px;box-shadow:0 20px 40px rgba(0,0,0,0.6);" width="100%">
    <tr>
      <td height="4" style="background:linear-gradient(90deg,#c8a86b,#e2c78c);border-radius:4px 4px 0 0;"></td>
    </tr>
    <tr><td>
      <div style="padding-top:24px;text-align:center;">
        <p style="margin:0;letter-spacing:0.25em;text-transform:uppercase;font-size:11px;color:#c8a86b;font-weight:600;">Mari Esthetics Studio</p>
        <h1 style="margin:8px 0 0;font-weight:400;font-size:28px;font-family:Georgia,serif;letter-spacing:0.04em;color:#f3efe6;">Official Invoice &amp; Receipt</h1>
        <p style="margin:6px 0 0;color:rgba(243,239,230,0.6);font-size:12px;">Invoice No: <span style="font-family:monospace;color:#c8a86b;">INV-SC-${String(charge._id).slice(-8).toUpperCase()}</span> &bull; ${dateLabel}</p>
      </div>

      <div style="margin:24px 0 16px;padding:16px;background:rgba(200,168,107,0.06);border:1px solid rgba(200,168,107,0.2);border-radius:12px;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#c8a86b;font-weight:700;">Billed To</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#f3efe6;">${charge.clientName || "Valued Client"}</p>
        <p style="margin:2px 0 0;font-size:12px;color:rgba(243,239,230,0.7);">${charge.clientEmail || ""}</p>
      </div>

      ${
        apptDateStr
          ? `<div style="margin:0 0 20px;padding:16px;background:#12241c;border:1px solid rgba(200,168,107,0.25);border-radius:12px;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#c8a86b;font-weight:700;">📅 Scheduled Treatment</p>
        <p style="margin:0;font-size:15px;font-weight:600;color:#f3efe6;">${serviceName} (${durationMin} min)</p>
        <p style="margin:4px 0 0;font-size:13px;color:#e2c78c;font-weight:500;">${apptDateStr}</p>
        <p style="margin:4px 0 0;font-size:11px;color:rgba(243,239,230,0.6);">📍 1211 Gillespie Cres NW, Edmonton, AB T6L 6X5</p>
      </div>`
          : ""
      }

      <table width="100%" style="font-size:13px;border-collapse:collapse;margin-top:16px;">
        <tr style="border-bottom:1px solid rgba(243,239,230,0.15);color:rgba(243,239,230,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">
          <th align="left" style="padding:8px 0;">Description</th>
          <th align="right" style="padding:8px 0;">Amount</th>
        </tr>
        <tr style="border-bottom:1px solid rgba(243,239,230,0.08);">
          <td style="padding:12px 0;color:#f3efe6;">${serviceName}</td>
          <td align="right" style="padding:12px 0;font-family:monospace;color:#f3efe6;">${formatCad(treatmentTotalCents)}</td>
        </tr>
        ${
          depositPaidCents > 0
            ? `<tr style="border-bottom:1px solid rgba(243,239,230,0.08);color:#9dceb8;">
          <td style="padding:10px 0;">Reservation Deposit Paid Earlier</td>
          <td align="right" style="padding:10px 0;font-family:monospace;">-${formatCad(depositPaidCents)}</td>
        </tr>`
            : ""
        }
        <tr style="border-bottom:1px solid rgba(243,239,230,0.08);">
          <td style="padding:10px 0;color:#f3efe6;">Remaining Balance Paid Today</td>
          <td align="right" style="padding:10px 0;font-family:monospace;color:#f3efe6;">${formatCad(charge.baseAmountCents)}</td>
        </tr>
        ${
          charge.tipCents > 0
            ? `<tr style="border-bottom:1px solid rgba(243,239,230,0.08);color:rgba(243,239,230,0.85);">
          <td style="padding:10px 0;">Gratuity / Tip (${charge.tipPercent}%)</td>
          <td align="right" style="padding:10px 0;font-family:monospace;color:#f3efe6;">+${formatCad(charge.tipCents)}</td>
        </tr>`
            : ""
        }
        <tr style="border-top:1px solid rgba(200,168,107,0.4);">
          <td style="padding:14px 0;font-weight:700;font-size:15px;color:#c8a86b;">Total Charged Today</td>
          <td align="right" style="padding:14px 0;font-weight:700;font-size:16px;font-family:monospace;color:#c8a86b;">${formatCad(charge.totalCents)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:rgba(243,239,230,0.65);">Total Paid Across Treatment</td>
          <td align="right" style="padding:6px 0;font-size:12px;font-family:monospace;color:rgba(243,239,230,0.85);">${formatCad(depositPaidCents + charge.totalCents)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;font-weight:600;color:#9dceb8;">Balance Remaining at Studio</td>
          <td align="right" style="padding:6px 0;font-size:12px;font-weight:600;font-family:monospace;color:#9dceb8;">$0.00 (Fully Settled)</td>
        </tr>
      </table>

      <div style="margin-top:28px;padding-top:16px;border-top:1px solid rgba(243,239,230,0.1);text-align:center;font-size:11px;color:rgba(243,239,230,0.5);">
        <p style="margin:0 0 4px;color:#f3efe6;font-weight:500;">Thank you for visiting Mari Esthetics!</p>
        <p style="margin:0;">1211 Gillespie Cres NW, Edmonton, AB &bull; <a href="mailto:info@mariesthetics.ca" style="color:#c8a86b;text-decoration:none;">info@mariesthetics.ca</a></p>
      </div>
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

  let booking = null;
  if (charge.bookingId) {
    try {
      const { Booking } = await import("@/lib/db/models");
      await import("@/lib/db/models/Service");
      booking = await Booking.findById(charge.bookingId).populate("serviceId").lean();
    } catch {
      // ignore
    }
  }

  const result = await sendEmail({
    to: charge.clientEmail,
    subject: `Official Invoice & Receipt from Mari Esthetics — ${formatCad(charge.totalCents)}`,
    html: invoiceHtml(charge, booking),
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

  // Ensure this studio charge is linked to the client's booking and settles it
  try {
    const { Booking, Payment } = await import("@/lib/db/models");
    let bookingId = charge.bookingId;

    if (!bookingId && charge.clientEmail) {
      // Find open booking with balance due for this client
      const matched = await Booking.findOne({
        "guest.email": charge.clientEmail.toLowerCase().trim(),
        status: { $in: ["confirmed", "completed"] },
        "paymentSummary.balanceDueCents": { $gt: 0 },
      }).sort({ start: -1 });

      if (matched) {
        bookingId = matched._id;
        charge.bookingId = matched._id;
        await charge.save();
      }
    }

    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        const stripeSession = sessionId || charge.stripeCheckoutSessionId || "";

        // Record balance payment idempotently
        const existingBalance = await Payment.findOne({
          bookingId: booking._id,
          kind: "balance",
          $or: [
            ...(stripeSession ? [{ stripeCheckoutSessionId: stripeSession }] : []),
            { amountCents: charge.baseAmountCents, status: "succeeded" },
          ],
        });

        if (!existingBalance) {
          await Payment.create({
            bookingId: booking._id,
            kind: "balance",
            method: "stripe",
            amountCents: charge.baseAmountCents,
            status: "succeeded",
            stripeCheckoutSessionId: stripeSession,
            confirmedAt: new Date(),
          });
        }

        // Record tip payment idempotently (either from explicit tipCents or totalCents exceeding baseAmountCents)
        const tipAmount = charge.tipCents > 0
          ? charge.tipCents
          : Math.max(0, (charge.totalCents || 0) - (charge.baseAmountCents || 0));

        if (tipAmount > 0) {
          const existingTip = await Payment.findOne({
            bookingId: booking._id,
            kind: "tip",
            $or: [
              ...(stripeSession ? [{ stripeCheckoutSessionId: stripeSession }] : []),
              { amountCents: tipAmount, status: "succeeded" },
            ],
          });

          if (!existingTip) {
            await Payment.create({
              bookingId: booking._id,
              kind: "tip",
              method: "stripe",
              amountCents: tipAmount,
              status: "succeeded",
              stripeCheckoutSessionId: stripeSession,
              confirmedAt: new Date(),
            });
          }
        }

        // Recalculate summary from all succeeded payments for guaranteed accuracy
        const succeededPayments = await Payment.find({
          bookingId: booking._id,
          status: "succeeded",
        });

        const nonTipPaid = succeededPayments
          .filter((p) => p.kind !== "tip")
          .reduce((sum, p) => sum + (p.amountCents || 0), 0);
        const explicitTipPaid = succeededPayments
          .filter((p) => p.kind === "tip")
          .reduce((sum, p) => sum + (p.amountCents || 0), 0);

        const summary = booking.paymentSummary ?? {
          totalCents: 0,
          depositCents: 0,
          paidCents: 0,
          tipCents: 0,
          discountCents: 0,
          balanceDueCents: 0,
        };

        const netServicePrice = Math.max(0, (summary.totalCents ?? 0) - (summary.discountCents ?? 0));
        const totalAllPaid = succeededPayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);
        const impliedTip = Math.max(0, totalAllPaid - netServicePrice);

        summary.tipCents = Math.max(summary.tipCents ?? 0, explicitTipPaid, impliedTip, tipAmount);
        const rawPaid = Math.max(summary.paidCents ?? 0, nonTipPaid);
        summary.paidCents = netServicePrice > 0 ? Math.min(netServicePrice, rawPaid) : rawPaid;
        summary.balanceDueCents = Math.max(0, netServicePrice - summary.paidCents);
        booking.paymentSummary = summary;
        await booking.save();

        // Cancel any remaining open studio charges for this booking
        await StudioCharge.updateMany(
          { bookingId: booking._id, status: "open" },
          { $set: { status: "cancelled" } }
        );
      }
    }
  } catch (bookingErr) {
    console.error("[Studio charge] Failed to update booking for paid charge:", bookingErr);
  }

  await emailStudioInvoice(String(charge._id));
  return charge;
}

export async function confirmStudioChargeFromSession(sessionId: string, expectedChargeId: string) {
  if (!sessionId || !isStripeConfigured()) return null;
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return null;
  const chargeId = session.metadata?.studioChargeId;
  if (!chargeId || session.metadata?.kind !== "studio_charge") return null;
  if (chargeId !== expectedChargeId) return null;
  return markStudioChargePaid(chargeId, session.id);
}
