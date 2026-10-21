import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { SubscriptionPlan } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDb();
    // ⚡ Bolt Optimization: Use .lean() to return plain Javascript objects and bypass Mongoose document hydration.
    const plans = await SubscriptionPlan.find({ active: true }).lean();
    return NextResponse.json({ plans });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}
