import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { Payment } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";

export async function GET() {
  try {
    await requireManager();
    await connectDb();
    // ⚡ Bolt Optimization: Use .lean() to eliminate Mongoose document hydration overhead on read query
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("bookingId")
      .lean();
    return NextResponse.json({ payments });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 });
  }
}
