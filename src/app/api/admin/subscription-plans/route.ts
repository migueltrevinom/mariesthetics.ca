import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { SubscriptionPlan } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";

import { syncStripePriceForPlan } from "@/lib/payments/subscriptionSync";

const createSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional().default(""),
  interval: z.enum(["month", "year"]),
  priceCents: z.number().min(0, "Price must be positive"),
  billingNote: z.string().optional().default(""),
  includedServiceIds: z.array(z.string()).optional().default([]),
  visitsPerPeriod: z.number().min(1).optional().default(1),
  active: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    await requireManager();
    await connectDb();
    const plans = await SubscriptionPlan.find({})
      .sort({ createdAt: -1 })
      .populate("includedServiceIds");
    return NextResponse.json({ plans });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch subscription plans" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireManager();
    const body = createSchema.parse(await req.json());
    await connectDb();

    // Automatically create Stripe Product & Price ID
    const stripePriceId = await syncStripePriceForPlan({
      name: body.name,
      priceCents: body.priceCents,
      interval: body.interval,
    });

    const plan = await SubscriptionPlan.create({
      ...body,
      stripePriceId,
    });

    const populatedPlan = await SubscriptionPlan.findById(plan._id).populate("includedServiceIds");
    return NextResponse.json({ plan: populatedPlan }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create subscription plan" }, { status: 500 });
  }
}
