import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { SubscriptionPlan } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDb();
    const plans = await SubscriptionPlan.find({ active: true });
    return NextResponse.json({ plans });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}
