import { NextResponse } from "next/server";
import { z } from "zod";
import { addMonths, addYears } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Client, ClientSubscription, SubscriptionPlan } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";

const createSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  planId: z.string().min(1, "Subscription plan is required"),
  status: z.enum(["active", "past_due", "cancelled", "paused"]).optional().default("active"),
  customPeriodStart: z.string().optional(),
  stripeSubscriptionId: z.string().optional().default(""),
});

export async function GET() {
  try {
    await requireManager();
    await connectDb();

    const clientSubscriptions = await ClientSubscription.find({})
      .sort({ createdAt: -1 })
      .populate("clientId", "name email phone")
      .populate("planId");

    return NextResponse.json({ clientSubscriptions });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch client subscriptions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireManager();
    const body = createSchema.parse(await req.json());
    await connectDb();

    const client = await Client.findById(body.clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const plan = await SubscriptionPlan.findById(body.planId);
    if (!plan) {
      return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
    }

    const start = body.customPeriodStart ? new Date(body.customPeriodStart) : new Date();
    const end = plan.interval === "year" ? addYears(start, 1) : addMonths(start, 1);

    const subscription = await ClientSubscription.create({
      clientId: client._id,
      planId: plan._id,
      status: body.status,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      stripeSubscriptionId: body.stripeSubscriptionId,
      visitsUsedThisPeriod: 0,
    });

    // Link subscription to Client document activeSubscription array if not already present
    if (!client.activeSubscriptions) client.activeSubscriptions = [];
    if (!client.activeSubscriptions.includes(subscription._id)) {
      client.activeSubscriptions.push(subscription._id);
      await client.save();
    }

    const populated = await ClientSubscription.findById(subscription._id)
      .populate("clientId", "name email phone")
      .populate("planId");

    return NextResponse.json({ subscription: populated }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create client subscription" }, { status: 500 });
  }
}
