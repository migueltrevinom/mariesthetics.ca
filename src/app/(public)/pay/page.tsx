import type { Metadata } from "next";
import { connectDb } from "@/lib/db/connect";
import { StudioCharge } from "@/lib/db/models";
import { confirmStudioChargeFromSession, publicStudioCharge } from "@/lib/payments/studioCharge";
import { verifyStudioChargeToken } from "@/lib/payments/studioChargeToken";
import { StudioPayTerminal } from "@/components/public/StudioPayTerminal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pay | Mari Esthetics",
  robots: { index: false, follow: false },
};

export default async function PayPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; paid?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  // Middleware already rejects bad tokens with 401; verify again so this page never trusts input.
  const chargeId = await verifyStudioChargeToken(params.t);
  let charge = null;

  if (chargeId) {
    try {
      await connectDb();
      if (params.paid === "1" && params.session_id) {
        await confirmStudioChargeFromSession(params.session_id, chargeId);
      }
      const record = await StudioCharge.findById(chargeId).lean();
      if (record && record.status !== "cancelled") {
        let booking = null;
        let payments = null;
        const { Booking, Payment } = await import("@/lib/db/models");
        await import("@/lib/db/models/Service");

        if (record.bookingId) {
          booking = await Booking.findById(record.bookingId).populate("serviceId").lean();
          payments = await Payment.find({ bookingId: record.bookingId, status: "succeeded" }).lean();
        } else if (record.clientEmail) {
          booking = await Booking.findOne({
            "guest.email": record.clientEmail.toLowerCase().trim(),
            status: { $in: ["confirmed", "completed"] },
          })
            .sort({ start: -1 })
            .populate("serviceId")
            .lean();
          if (booking) {
            payments = await Payment.find({ bookingId: booking._id, status: "succeeded" }).lean();
          }
        }

        charge = publicStudioCharge(record, booking, payments);
      }
    } catch (err) {
      console.error("[Pay page]", err);
    }
  }

  return <StudioPayTerminal charge={charge} token={chargeId ? params.t ?? "" : ""} />;
}
