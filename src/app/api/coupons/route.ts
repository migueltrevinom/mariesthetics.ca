import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Coupon } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";

export async function GET() {
  try {
    await connectDb();
    const coupons = await Coupon.find({ active: true }).sort({ createdAt: -1 });
    return NextResponse.json({ coupons });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
  }
}

const schema = z.object({
  code: z.string().min(2),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    await requireManager();
    const body = schema.parse(await req.json());
    await connectDb();
    const coupon = await Coupon.create({
      ...body,
      code: body.code.toUpperCase(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
