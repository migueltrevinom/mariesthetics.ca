import type { Metadata } from "next";
import { connectDb } from "@/lib/db/connect";
import { StudioCharge } from "@/lib/db/models";
import { confirmStudioChargeFromSession, publicStudioCharge } from "@/lib/payments/studioCharge";
import { StudioPayTerminal } from "@/components/public/StudioPayTerminal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pay | Mari Esthetics",
  robots: { index: false, follow: false },
};

export default async function PayPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; charge?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  let charge = null;

  try {
    await connectDb();
    if (params.paid === "1" && params.session_id) {
      await confirmStudioChargeFromSession(params.session_id);
    }

    const record = params.charge
      ? await StudioCharge.findById(params.charge).lean()
      : await StudioCharge.findOne({ status: "open" }).sort({ createdAt: -1 }).lean();

    if (record && record.status !== "cancelled") {
      charge = publicStudioCharge(record);
    }
  } catch (err) {
    console.error("[Pay page]", err);
  }

  return <StudioPayTerminal charge={charge} variant="page" />;
}
