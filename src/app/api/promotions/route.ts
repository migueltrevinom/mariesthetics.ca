import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { Promotion } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDb();
    const now = new Date();
    // Performance optimization: .lean() bypasses Mongoose document hydration overhead on read-only query.
    const promotions = await Promotion.find({
      active: true,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    }).populate("serviceIds").lean();
    return NextResponse.json({ promotions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load promotions" }, { status: 500 });
  }
}
