import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { SubscriptionPlan } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDb();
    // ⚡ Bolt Optimization: Use .lean() on read-only queries to bypass document hydration
    // overhead and reduce memory allocations when fetching active subscription plans.
    const plans = await SubscriptionPlan.find({ active: true }).lean();
    return NextResponse.json({ plans });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}
