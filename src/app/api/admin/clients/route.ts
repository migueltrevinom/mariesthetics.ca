import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { Client } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";

export async function GET() {
  try {
    await requireManager();
    await connectDb();
    const clients = await Client.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("subscription");
    return NextResponse.json({ clients });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
  }
}
