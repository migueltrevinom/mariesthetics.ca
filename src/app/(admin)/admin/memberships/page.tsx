import { connectDb } from "@/lib/db/connect";
import { Client, ClientSubscription, Service, SubscriptionPlan } from "@/lib/db/models";
import { requireManager } from "@/lib/auth/jwt";
import { SubscriptionsManager } from "@/components/admin/SubscriptionsManager";

export const dynamic = "force-dynamic";

export default async function AdminMembershipsPage() {
  await requireManager();
  await connectDb();

  const [plans, clientSubscriptions, services, clients] = await Promise.all([
    SubscriptionPlan.find({}).sort({ createdAt: -1 }).populate("includedServiceIds").lean(),
    ClientSubscription.find({})
      .sort({ createdAt: -1 })
      .populate("clientId", "name email phone")
      .populate("planId")
      .lean(),
    Service.find({ active: true }).select("name category priceCents").sort({ name: 1 }).lean(),
    Client.find({}).select("name email phone").sort({ name: 1 }).lean(),
  ]);

  const serializedPlans = plans.map((p: any) => ({
    _id: String(p._id),
    name: String(p.name),
    description: String(p.description || ""),
    interval: p.interval as "month" | "year",
    priceCents: Number(p.priceCents),
    billingNote: p.billingNote ? String(p.billingNote) : "",
    visitsPerPeriod: Number(p.visitsPerPeriod || 1),
    active: Boolean(p.active),
    stripePriceId: p.stripePriceId ? String(p.stripePriceId) : "",
    includedServiceIds: (p.includedServiceIds || []).map((s: any) =>
      typeof s === "object" && s !== null
        ? { _id: String(s._id), name: String(s.name), priceCents: Number(s.priceCents) }
        : String(s)
    ),
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
  }));

  const serializedClientSubs = clientSubscriptions.map((sub: any) => ({
    _id: String(sub._id),
    clientId: sub.clientId
      ? {
          _id: String(sub.clientId._id),
          name: String(sub.clientId.name),
          email: String(sub.clientId.email),
          phone: sub.clientId.phone ? String(sub.clientId.phone) : undefined,
        }
      : null,
    planId: sub.planId
      ? {
          _id: String(sub.planId._id),
          name: String(sub.planId.name),
          description: String(sub.planId.description || ""),
          interval: sub.planId.interval as "month" | "year",
          priceCents: Number(sub.planId.priceCents),
          visitsPerPeriod: Number(sub.planId.visitsPerPeriod || 1),
          active: Boolean(sub.planId.active),
        }
      : null,
    status: sub.status as "active" | "past_due" | "cancelled" | "paused",
    currentPeriodStart: sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toISOString() : new Date().toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString() : new Date().toISOString(),
    stripeSubscriptionId: sub.stripeSubscriptionId ? String(sub.stripeSubscriptionId) : "",
    visitsUsedThisPeriod: Number(sub.visitsUsedThisPeriod || 0),
    createdAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : undefined,
  }));

  const serializedServices = services.map((s: any) => ({
    _id: String(s._id),
    name: String(s.name),
    category: s.category ? String(s.category) : undefined,
    priceCents: Number(s.priceCents),
  }));

  const serializedClients = clients.map((c: any) => ({
    _id: String(c._id),
    name: String(c.name),
    email: String(c.email),
    phone: c.phone ? String(c.phone) : undefined,
  }));

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <SubscriptionsManager
        initialPlans={serializedPlans}
        initialClientSubscriptions={serializedClientSubs}
        services={serializedServices}
        clients={serializedClients}
      />
    </div>
  );
}
