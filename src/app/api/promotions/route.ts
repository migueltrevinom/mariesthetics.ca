import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { Promotion } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDb();
    const now = new Date();
    // ⚡ Bolt Optimization: Use .lean() on read-only queries to bypass document hydration
    // overhead and reduce memory allocations when fetching active promotions.
    const promotions = await Promotion.find({
      active: true,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    })
      .populate("serviceIds")
      .lean();
    return NextResponse.json({ promotions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load promotions" }, { status: 500 });
  }
}
