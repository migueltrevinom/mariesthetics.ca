import { NextResponse } from "next/server";
import { withClientAuth, type SessionPayload } from "@/lib/auth/jwt";
import { connectDb } from "@/lib/db/connect";
import { Client, Booking, Payment, StudioCharge } from "@/lib/db/models";
import { markStudioChargePaid } from "@/lib/payments/studioCharge";
import "@/lib/db/models/Service";

async function handleGetPortalData(_req: Request, session: SessionPayload): Promise<NextResponse> {
  try {
    await connectDb();
    const clientId = session.sub;
    const clientEmail = session.email.toLowerCase().trim();

    // 1. Fetch Client profile
    let client = await Client.findById(clientId).lean();
    if (!client) {
      client = await Client.findOne({ email: clientEmail }).lean();
    }

    if (!client) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
    }

    // 2. Fetch all Bookings for this client
    const bookings = await Booking.find({
      $or: [{ clientId }, { "guest.email": clientEmail }],
    })
      .sort({ start: -1 })
      .populate("serviceId")
      .lean();

    const bookingIds = bookings.map((b) => b._id);

    // 3. Fetch Payments associated with client's bookings
    let payments = await Payment.find({
      bookingId: { $in: bookingIds },
    })
      .sort({ createdAt: -1 })
      .populate("bookingId")
      .lean();

    // 4. Fetch any Studio Charges billed directly to this client
    const studioCharges = await StudioCharge.find({
      clientEmail,
    })
      .sort({ createdAt: -1 })
      .lean();

    // 5. Proactive Self-Healing Reconciliation
    // Guarantee that any paid studio charge is linked to the booking, payments exist, and booking is marked settled
    let needsPaymentsReload = false;
    for (const b of bookings) {
      const linkedPaidCharges = studioCharges.filter(
        (c) =>
          c.status === "paid" &&
          (String(c.bookingId) === String(b._id) ||
            (!c.bookingId && (b.paymentSummary?.balanceDueCents || 0) > 0))
      );

      for (const charge of linkedPaidCharges) {
        if (!charge.bookingId) {
          charge.bookingId = b._id;
          await StudioCharge.updateOne({ _id: charge._id }, { $set: { bookingId: b._id } });
        }
        await markStudioChargePaid(String(charge._id));
        needsPaymentsReload = true;
      }
    }

    if (needsPaymentsReload) {
      payments = await Payment.find({
        bookingId: { $in: bookingIds },
      })
        .sort({ createdAt: -1 })
        .populate("bookingId")
        .lean();
    }

    // 6. Synthesize clean unified payment list
    type PortalPayment = {
      id: string;
      source: "booking" | "studio_charge";
      date: string;
      description: string;
      amountCents: number;
      kind: string;
      method: string;
      status: string;
      bookingId?: string;
      chargeId?: string;
    };

    const unifiedPayments: PortalPayment[] = [];

    // Add payments from bookings — only SUCCEEDED/PAID payments appear in receipts/invoices
    for (const p of payments) {
      if (p.status !== "succeeded" && p.status !== "paid") {
        continue;
      }

      // If this payment was created from a studio charge, let the studio charge entry represent it with its tip total
      if (p.kind === "balance" || p.kind === "tip") {
        const matchingCharge = studioCharges.find(
          (c) =>
            c.status === "paid" &&
            (c.stripeCheckoutSessionId === p.stripeCheckoutSessionId ||
              String(c.bookingId) === String((p as any).bookingId?._id || (p as any).bookingId))
        );
        if (matchingCharge) {
          continue; // The studio charge will be listed as the unified receipt
        }
      }

      const b = bookings.find((item) => String(item._id) === String((p as any).bookingId?._id || (p as any).bookingId));
      const serviceName = (b?.serviceId as any)?.name || "Treatment Service";
      unifiedPayments.push({
        id: String(p._id),
        source: "booking",
        date: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        description: `${serviceName} (${p.kind})`,
        amountCents: p.amountCents || 0,
        kind: p.kind,
        method: p.method,
        status: p.status,
        bookingId: b ? String(b._id) : undefined,
      });
    }

    // Add studio charges
    for (const c of studioCharges) {
      if (c.status === "paid") {
        const b = bookings.find((item) => String(item._id) === String(c.bookingId));
        const serviceName = (b?.serviceId as any)?.name;
        const description = serviceName
          ? `${serviceName} — Remaining Balance & Gratuity`
          : c.description || "Remaining Treatment Balance";

        unifiedPayments.push({
          id: String(c._id),
          source: "studio_charge",
          date: c.paidAt ? new Date(c.paidAt).toISOString() : (c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString()),
          description,
          amountCents: c.totalCents || 0,
          kind: "balance",
          method: "stripe",
          status: "succeeded",
          chargeId: String(c._id),
          bookingId: b ? String(b._id) : c.bookingId ? String(c.bookingId) : undefined,
        });
      }
    }

    // Also include completed bookings with payment summaries if direct Payment record doesn't exist
    for (const b of bookings) {
      const paid = b.paymentSummary?.paidCents || 0;
      if (paid > 0) {
        const hasPaymentRecord = unifiedPayments.some((p) => p.bookingId === String(b._id));
        if (!hasPaymentRecord) {
          const serviceName = (b.serviceId as any)?.name || "Esthetics Treatment";
          unifiedPayments.push({
            id: `booking-${String(b._id)}`,
            source: "booking",
            date: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
            description: `${serviceName} (Deposit & Payments)`,
            amountCents: paid,
            kind: "deposit",
            method: b.depositMethod || "stripe",
            status: "succeeded",
            bookingId: String(b._id),
          });
        }
      }
    }

    // Sort unified payments latest first
    unifiedPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 7. Calculate reconciled appointment ledger summaries
    const appointments = await Promise.all(
      bookings.map(async (b) => {
        const succeededForBooking = payments.filter(
          (p) =>
            String((p as any).bookingId?._id || (p as any).bookingId) === String(b._id) &&
            (p.status === "succeeded" || p.status === "paid")
        );

        const totalCents = b.paymentSummary?.totalCents || (b.serviceId as any)?.priceCents || 0;
        const depositCents = b.paymentSummary?.depositCents || 0;
        const discountCents = b.paymentSummary?.discountCents || 0;
        const netServicePrice = Math.max(0, totalCents - discountCents);

        const nonTipPaid = succeededForBooking
          .filter((p) => p.kind !== "tip")
          .reduce((sum, p) => sum + (p.amountCents || 0), 0);
        const explicitTipPaid = succeededForBooking
          .filter((p) => p.kind === "tip")
          .reduce((sum, p) => sum + (p.amountCents || 0), 0);

        // Smart Tip Detection: If total paid exceeds net treatment price, excess is recognized as tip
        const totalAllPaid = succeededForBooking.reduce((sum, p) => sum + (p.amountCents || 0), 0);
        const impliedTip = Math.max(0, totalAllPaid - netServicePrice);

        // Also check any linked studio charges with gratuity
        const linkedCharges = studioCharges.filter(
          (c) =>
            c.status === "paid" &&
            (String(c.bookingId) === String(b._id) ||
              (!c.bookingId && c.clientEmail === clientEmail))
        );
        const chargeTip = linkedCharges.reduce(
          (sum, c) => sum + (c.tipCents || Math.max(0, (c.totalCents || 0) - (c.baseAmountCents || 0))),
          0
        );

        const effectiveTipCents = Math.max(
          b.paymentSummary?.tipCents || 0,
          explicitTipPaid,
          impliedTip,
          chargeTip
        );

        // Treatment paid amount cannot exceed net service price, excess is considered tip
        const rawPaid = Math.max(b.paymentSummary?.paidCents || 0, nonTipPaid);
        const effectivePaidCents = netServicePrice > 0 ? Math.min(netServicePrice, rawPaid) : rawPaid;
        const effectiveBalanceDueCents = Math.max(0, netServicePrice - effectivePaidCents);

        // Permanently sync with Booking model in Mongo if anything changed
        if (
          b.paymentSummary?.tipCents !== effectiveTipCents ||
          b.paymentSummary?.paidCents !== effectivePaidCents ||
          b.paymentSummary?.balanceDueCents !== effectiveBalanceDueCents
        ) {
          await Booking.updateOne(
            { _id: b._id },
            {
              $set: {
                "paymentSummary.paidCents": effectivePaidCents,
                "paymentSummary.tipCents": effectiveTipCents,
                "paymentSummary.balanceDueCents": effectiveBalanceDueCents,
              },
            }
          );
        }

        // If booking is fully settled, cancel any obsolete pending balance payments
        if (effectiveBalanceDueCents === 0) {
          await Payment.updateMany(
            { bookingId: b._id, kind: "balance", status: "pending" },
            { $set: { status: "cancelled" } }
          );
        }

        const hasPendingBalance =
          effectiveBalanceDueCents > 0 &&
          payments.some(
            (p) =>
              String((p as any).bookingId?._id || (p as any).bookingId) === String(b._id) &&
              p.kind === "balance" &&
              p.status === "pending"
          );

        return {
          id: String(b._id),
          start: b.start,
          end: b.end,
          status: b.status,
          depositMethod: b.depositMethod,
          holdExpiresAt: b.holdExpiresAt,
          hasPendingBalance,
          service: b.serviceId
            ? {
                id: String((b.serviceId as any)._id),
                name: String((b.serviceId as any).name),
                category: String((b.serviceId as any).category || "facials"),
                durationMin: Number((b.serviceId as any).durationMin || 60),
                priceCents: Number((b.serviceId as any).priceCents || 0),
                photos: Array.isArray((b.serviceId as any).photos) ? (b.serviceId as any).photos : [],
              }
            : null,
          paymentSummary: {
            totalCents,
            depositCents,
            paidCents: effectivePaidCents,
            tipCents: effectiveTipCents,
            discountCents,
            balanceDueCents: effectiveBalanceDueCents,
          },
          etransferProofUrl: b.etransferProofUrl || "",
          createdAt: b.createdAt,
        };
      })
    );

    return NextResponse.json({
      client: {
        id: String(client._id),
        name: client.name,
        email: client.email,
        phone: client.phone || "",
        countryCode: client.countryCode || "+1",
        referralCode: client.referralCode || "",
        createdAt: client.createdAt,
      },
      appointments,
      payments: unifiedPayments,
    });
  } catch (err) {
    console.error("[handleGetPortalData Error]:", err);
    return NextResponse.json({ error: "Failed to load client portal data" }, { status: 500 });
  }
}

export const GET = withClientAuth(handleGetPortalData);
