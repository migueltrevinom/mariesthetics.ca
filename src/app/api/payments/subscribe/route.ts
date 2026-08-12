import { NextResponse } from "next/server";
import { z } from "zod";
import { addMonths, addYears } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Client, ClientSubscription, SubscriptionPlan } from "@/lib/db/models";
import { findOrCreateClientForGuest } from "@/lib/booking/clientResolver";
import { getAppUrl } from "@/lib/config";
import { getStripe } from "@/lib/payments/stripe";
import { getSession } from "@/lib/auth/jwt";

const subscribeSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  paymentMethod: z.enum(["stripe", "etransfer"]).optional().default("stripe"),
  guest: z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      countryCode: z.string().optional().default("+1"),
      phone: z.string().optional().default(""),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    const body = subscribeSchema.parse(await req.json());
    await connectDb();

    const plan = await SubscriptionPlan.findById(body.planId);
    if (!plan || !plan.active) {
      return NextResponse.json({ error: "Subscription plan not found or inactive" }, { status: 404 });
    }

    const session = await getSession();
    let guest = body.guest;

    if (session?.role === "client" && !guest) {
      guest = {
        name: session.name,
        email: session.email,
        countryCode: "+1",
        phone: "",
      };
    }

    if (!guest) {
      return NextResponse.json({ error: "Guest details are required" }, { status: 400 });
    }

    const client = await findOrCreateClientForGuest(guest);
    if (!client) {
      return NextResponse.json({ error: "Failed to resolve client" }, { status: 500 });
    }

    const baseUrl = getAppUrl(req);
    const start = new Date();
    const end = plan.interval === "year" ? addYears(start, 1) : addMonths(start, 1);

    if (body.paymentMethod === "stripe") {
      const stripe = getStripe();
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: client.email,
        line_items: [
          {
            price_data: {
              currency: "cad",
              product_data: {
                name: `Mari Esthetics Membership: ${plan.name}`,
                description: plan.description || `${plan.visitsPerPeriod} visits per ${plan.interval}`,
              },
              unit_amount: plan.priceCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          clientId: String(client._id),
          planId: String(plan._id),
          kind: "subscription_initial",
        },
        success_url: `${baseUrl}/payment-link?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
        cancel_url: `${baseUrl}/services?cancelled=true`,
      });

      // Create pending ClientSubscription
      const subscription = await ClientSubscription.create({
        clientId: client._id,
        planId: plan._id,
        status: "active",
        currentPeriodStart: start,
        currentPeriodEnd: end,
        stripeSubscriptionId: checkoutSession.id,
        visitsUsedThisPeriod: 0,
      });

      if (!client.activeSubscriptions) client.activeSubscriptions = [];
      if (!client.activeSubscriptions.includes(subscription._id)) {
        client.activeSubscriptions.push(subscription._id);
        await client.save();
      }

      return NextResponse.json({
        url: checkoutSession.url,
        subscriptionId: String(subscription._id),
      });
    }

    // e-Transfer flow
    const subscription = await ClientSubscription.create({
      clientId: client._id,
      planId: plan._id,
      status: "active",
      currentPeriodStart: start,
      currentPeriodEnd: end,
      visitsUsedThisPeriod: 0,
    });

    if (!client.activeSubscriptions) client.activeSubscriptions = [];
    if (!client.activeSubscriptions.includes(subscription._id)) {
      client.activeSubscriptions.push(subscription._id);
      await client.save();
    }

    return NextResponse.json({
      success: true,
      message: `Subscription created! Send Interac e-Transfer for ${plan.priceCents / 100} CAD to mari@mariesthetics.ca to complete setup.`,
      subscriptionId: String(subscription._id),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to initiate subscription" }, { status: 500 });
  }
}
