import { NextResponse } from "next/server";
import { withClientAuth, type SessionPayload } from "@/lib/auth/jwt";
import { connectDb } from "@/lib/db/connect";
import { Booking, Payment, StudioCharge, Client } from "@/lib/db/models";
import "@/lib/db/models/Service";

async function handleGetInvoice(
  _req: Request,
  session: SessionPayload,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await connectDb();

    const clientId = session.sub;
    const clientEmail = session.email.toLowerCase().trim();

    // Clean prefix if it came from booking-id
    const targetId = id.replace(/^booking-/, "");

    // 1. Check if it's a Payment ID
    let payment = await Payment.findById(targetId).populate("bookingId").lean();

    // 2. Check if it's a Booking ID
    let booking = null;
    if (payment && payment.bookingId) {
      booking = await Booking.findById((payment.bookingId as any)._id || payment.bookingId).populate("serviceId").lean();
    } else {
      booking = await Booking.findById(targetId).populate("serviceId").lean();
    }

    // 3. Check if it's a Studio Charge ID
    let studioCharge = null;
    if (!booking && !payment) {
      studioCharge = await StudioCharge.findById(targetId).lean();
      if (studioCharge?.bookingId) {
        booking = await Booking.findById(studioCharge.bookingId).populate("serviceId").lean();
      }
    }

    // Fetch client
    const client = await Client.findById(clientId).lean();

    // Handle Studio Charge without booking
    if (studioCharge && !booking) {
      if (
        studioCharge.clientEmail.toLowerCase() !== clientEmail &&
        (!client || studioCharge.clientName.toLowerCase() !== client.name.toLowerCase())
      ) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      return NextResponse.json({
        invoice: {
          number: `INV-SC-${String(studioCharge._id).slice(-8).toUpperCase()}`,
          id: String(studioCharge._id),
          type: "studio_charge",
          date: studioCharge.paidAt || studioCharge.createdAt,
          status: studioCharge.status === "paid" ? "PAID" : studioCharge.status.toUpperCase(),
          merchant: {
            name: "Mari Esthetics",
            tagline: "Private Esthetics Studio",
            address: "1211 Gillespie Cres NW, Edmonton, AB T6L 6X5",
            email: "info@mariesthetics.ca",
            phone: "+1 (825) 785-3081",
          },
          client: {
            name: studioCharge.clientName || client?.name || "Valued Client",
            email: studioCharge.clientEmail || clientEmail,
            phone: client?.phone || "",
          },
          appointment: null,
          reconciliation: {
            treatmentTotalCents: studioCharge.baseAmountCents,
            depositPaidCents: 0,
            balancePaidCents: studioCharge.baseAmountCents,
            tipPercent: studioCharge.tipPercent,
            tipCents: studioCharge.tipCents,
            discountCents: 0,
            totalChargedTodayCents: studioCharge.totalCents,
            totalPaidToDateCents: studioCharge.totalCents,
            balanceDueCents: studioCharge.status === "paid" ? 0 : studioCharge.totalCents,
          },
          items: [
            {
              description: studioCharge.description || "Studio Esthetics Charge",
              amountCents: studioCharge.baseAmountCents,
            },
            ...(studioCharge.tipCents > 0
              ? [
                  {
                    description: `Gratuity / Tip (${studioCharge.tipPercent}%)`,
                    amountCents: studioCharge.tipCents,
                  },
                ]
              : []),
          ],
          subtotalCents: studioCharge.baseAmountCents,
          tipCents: studioCharge.tipCents,
          totalCents: studioCharge.totalCents,
          paidCents: studioCharge.status === "paid" ? studioCharge.totalCents : 0,
          balanceDueCents: studioCharge.status === "paid" ? 0 : studioCharge.totalCents,
          paymentMethod: "Stripe Online Card",
        },
      });
    }

    // Handle Booking / Payment invoice
    if (booking) {
      const isOwner =
        (booking.clientId && String(booking.clientId) === clientId) ||
        (booking.guest?.email && booking.guest.email.toLowerCase() === clientEmail);

      if (!isOwner) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const service = booking.serviceId as any;
      const serviceName = service?.name || "Esthetics Treatment";
      const durationMin = service?.durationMin || 60;

      const summary = booking.paymentSummary || {
        totalCents: 0,
        depositCents: 0,
        paidCents: 0,
        tipCents: 0,
        discountCents: 0,
        balanceDueCents: 0,
      };

      const payments = await Payment.find({ bookingId: booking._id, status: "succeeded" }).lean();
      const depositPayment = payments.find((p) => p.kind === "deposit");
      const balancePayment = payments.find((p) => p.kind === "balance");
      const tipPayment = payments.find((p) => p.kind === "tip");

      const treatmentTotalCents = summary.totalCents || service?.priceCents || 0;
      const depositPaidCents = depositPayment?.amountCents || summary.depositCents || 0;
      const balancePaidCents = balancePayment?.amountCents || studioCharge?.baseAmountCents || (summary.paidCents > depositPaidCents ? summary.paidCents - depositPaidCents : 0);
      const tipPaidCents = summary.tipCents || tipPayment?.amountCents || studioCharge?.tipCents || 0;
      const totalPaidToDateCents = summary.paidCents + tipPaidCents;
      const invoiceNumber = `INV-${String(booking._id).slice(-8).toUpperCase()}`;

      return NextResponse.json({
        invoice: {
          number: invoiceNumber,
          id: String(booking._id),
          type: "booking",
          date: booking.createdAt,
          appointmentDate: booking.start,
          status:
            booking.status === "completed" || summary.balanceDueCents === 0
              ? "PAID"
              : "CONFIRMED",
          merchant: {
            name: "Mari Esthetics",
            tagline: "Private Esthetics Studio",
            address: "1211 Gillespie Cres NW, Edmonton, AB T6L 6X5",
            email: "info@mariesthetics.ca",
            phone: "+1 (825) 785-3081",
          },
          client: {
            name: booking.guest?.name || client?.name || "Valued Client",
            email: booking.guest?.email || clientEmail,
            phone: booking.guest?.phone || client?.phone || "",
          },
          appointment: {
            id: String(booking._id),
            serviceName,
            durationMin,
            start: booking.start ? new Date(booking.start).toISOString() : null,
            end: booking.end ? new Date(booking.end).toISOString() : null,
          },
          reconciliation: {
            treatmentTotalCents,
            depositPaidCents,
            balancePaidCents,
            tipPercent: studioCharge?.tipPercent ?? (tipPaidCents > 0 && treatmentTotalCents > 0 ? Math.round((tipPaidCents / treatmentTotalCents) * 100) : 0),
            tipCents: tipPaidCents,
            discountCents: summary.discountCents || 0,
            totalChargedTodayCents: balancePaidCents + tipPaidCents,
            totalPaidToDateCents,
            balanceDueCents: summary.balanceDueCents,
          },
          items: [
            {
              description: `${serviceName} (${durationMin} min)`,
              amountCents: treatmentTotalCents,
            },
            ...(tipPaidCents > 0
              ? [
                  {
                    description: `Gratuity / Tip${studioCharge?.tipPercent ? ` (${studioCharge.tipPercent}%)` : ""}`,
                    amountCents: tipPaidCents,
                  },
                ]
              : []),
            ...(summary.discountCents > 0
              ? [
                  {
                    description: "Promotional Discount",
                    amountCents: -summary.discountCents,
                  },
                ]
              : []),
          ],
          subtotalCents: treatmentTotalCents,
          tipCents: tipPaidCents,
          discountCents: summary.discountCents,
          totalCents: treatmentTotalCents + tipPaidCents - summary.discountCents,
          paidCents: totalPaidToDateCents,
          balanceDueCents: summary.balanceDueCents,
          paymentMethod: booking.depositMethod ? booking.depositMethod.toUpperCase() === "ETRANSFER" ? "Interac e-Transfer" : "Stripe Online Card" : "Stripe Online Card",
        },
      });
    }

    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  } catch (err: unknown) {
    console.error("[handleGetInvoice Error]:", err);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}

export const GET = withClientAuth(handleGetInvoice as any);
