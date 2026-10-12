import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { StudioCharge } from "@/lib/db/models";
import { publicStudioCharge } from "@/lib/payments/studioCharge";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const charge = id
      ? await StudioCharge.findById(id).lean()
      : await StudioCharge.findOne({ status: "open" }).sort({ createdAt: -1 }).lean();

    if (!charge || (id && charge.status === "cancelled")) {
      return NextResponse.json({ charge: null });
    }

    return NextResponse.json({ charge: publicStudioCharge(charge) });
  } catch (err) {
    console.error("[Studio charge read]", err);
    return NextResponse.json({ error: "Failed to load charge" }, { status: 500 });
  }
}
