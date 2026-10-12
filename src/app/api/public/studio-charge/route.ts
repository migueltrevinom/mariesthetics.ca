import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { StudioCharge } from "@/lib/db/models";
import { publicStudioCharge } from "@/lib/payments/studioCharge";
import { tokenFromRequest, verifyStudioChargeToken } from "@/lib/payments/studioChargeToken";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function GET(req: Request) {
  const chargeId = await verifyStudioChargeToken(tokenFromRequest(req));
  if (!chargeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  }
  try {
    await connectDb();
    const charge = await StudioCharge.findById(chargeId).lean();
    if (!charge || charge.status === "cancelled") {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
    }
    return NextResponse.json({ charge: publicStudioCharge(charge) }, { headers: noStore });
  } catch (err) {
    console.error("[Studio charge read]", err);
    return NextResponse.json({ error: "Failed to load charge" }, { status: 500, headers: noStore });
  }
}
