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
        charge = publicStudioCharge(record);
      }
    } catch (err) {
      console.error("[Pay page]", err);
    }
  }

  return <StudioPayTerminal charge={charge} token={chargeId ? params.t ?? "" : ""} />;
}
