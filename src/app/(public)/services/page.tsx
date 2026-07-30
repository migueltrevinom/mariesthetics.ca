import type { Metadata } from "next";
import Link from "next/link";
import { connectDb } from "@/lib/db/connect";
import { Promotion, Service, SubscriptionPlan } from "@/lib/db/models";
import { formatCad } from "@/lib/money";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/public/Reveal";
import {
  breadcrumbJsonLd,
  buildMetadata,
  serviceCatalogJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Services & Pricing",
  description:
    "Facials, lash lifts, brow shaping and dermaplaning in Edmonton, AB. See transparent pricing and book your appointment at Mari Esthetics.",
  path: "/services",
  keywords: [
    "facials Edmonton pricing",
    "lash lift Edmonton price",
    "brow shaping Edmonton",
    "dermaplaning Edmonton",
    "esthetics services Edmonton",
  ],
});

type Svc = {
  _id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  depositCents: number;
  category: string;
};

type Plan = {
  _id: string;
  name: string;
  description: string;
  interval: string;
  priceCents: number;
  billingNote?: string;
};

type Promo = { _id: string; title: string; description: string };

async function getData() {
  try {
    await connectDb();
    const [services, promotions, plans] = await Promise.all([
      Service.find({ active: true }).sort({ sortOrder: 1 }).lean(),
      Promotion.find({
        active: true,
        startsAt: { $lte: new Date() },
        endsAt: { $gte: new Date() },
      }).lean(),
      SubscriptionPlan.find({ active: true }).lean(),
    ]);
    return {
      offline: false,
      services: services.map((s) => ({
        _id: String(s._id),
        name: String(s.name),
        description: String(s.description ?? ""),
        durationMin: Number(s.durationMin),
        priceCents: Number(s.priceCents),
        depositCents: Number(s.depositCents),
        category: String(s.category ?? "general"),
      })) as Svc[],
      promotions: promotions.map((p) => ({
        _id: String(p._id),
        title: String(p.title),
        description: String(p.description ?? ""),
      })) as Promo[],
      plans: plans.map((p) => ({
        _id: String(p._id),
        name: String(p.name),
        description: String(p.description ?? ""),
        interval: String(p.interval),
        priceCents: Number(p.priceCents),
        billingNote: p.billingNote ? String(p.billingNote) : undefined,
      })) as Plan[],
    };
  } catch {
    return { offline: true, services: [], promotions: [], plans: [] };
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  facial: "Facials",
  lashes: "Lashes",
  brows: "Brows",
  general: "More",
};

export default async function ServicesPage() {
  const { services, promotions, plans, offline } = await getData();

  const categories = Array.from(new Set(services.map((s) => s.category)));

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] min-h-screen">
      {/* Hero band */}
      <section className="aurora relative overflow-hidden pt-40 pb-20 md:pt-48">
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6 md:px-10">
          <p className="reveal eyebrow">Services &amp; pricing</p>
          <h1 className="reveal reveal-delay-1 display mt-5 max-w-3xl text-5xl text-[var(--ink)] md:text-7xl">
            Clear pricing.
            <span className="gold-text italic"> No surprises.</span>
          </h1>
          <p className="reveal reveal-delay-2 mt-6 max-w-xl text-[var(--ink-soft)] leading-relaxed">
            Every treatment is personalized in a private Edmonton studio. A
            deposit secures your appointment; the balance is settled after your
            visit.
          </p>
          {categories.length > 0 && (
            <div className="reveal reveal-delay-3 mt-10 flex flex-wrap gap-2.5">
              {categories.map((c) => (
                <a key={c} href={`#${c}`} className="chip">
                  {CATEGORY_LABELS[c] ?? c}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-20 md:px-10">
        {offline && (
          <p className="mb-10 rounded border border-[var(--line)] bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--ink-soft)]">
            Connect MongoDB and run <code className="text-gold">npm run seed</code>{" "}
            to load live services.
          </p>
        )}

        {categories.map((category) => (
          <div key={category} id={category} className="scroll-mt-28 pb-16">
            <div className="mb-8 flex items-center gap-4">
              <h2 className="display text-3xl text-[var(--ink)] md:text-4xl">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <span className="hairline flex-1" />
            </div>
            <div className="divide-y divide-[var(--line-soft)]">
              {services
                .filter((s) => s.category === category)
                .map((service) => (
                  <Reveal
                    key={service._id}
                    className="flex flex-col gap-4 py-7 sm:flex-row sm:items-end sm:justify-between"
                  >
                    <div>
                      <h3 className="display text-2xl text-[var(--ink)]">
                        {service.name}
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--ink-soft)]">
                        {service.description}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-wider text-[var(--ink-faint)] font-medium">
                        {service.durationMin} min · deposit{" "}
                        {formatCad(service.depositCents)}
                      </p>
                    </div>
                    <div className="flex items-center gap-5">
                      <span className="gold-text text-2xl font-semibold">
                        {formatCad(service.priceCents)}
                      </span>
                      <Link
                        href={`/book?serviceId=${service._id}`}
                        className="btn-ghost !py-2.5 !px-5 text-sm"
                      >
                        Book
                      </Link>
                    </div>
                  </Reveal>
                ))}
            </div>
          </div>
        ))}

        {!offline && services.length === 0 && (
          <p className="text-[var(--ink-soft)]">No services published yet.</p>
        )}

        {promotions.length > 0 && (
          <div className="border-t border-[var(--line-soft)] pt-14">
            <h2 className="display text-3xl text-[var(--ink)]">Current offers</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {promotions.map((promo) => (
                <div key={promo._id} className="card p-6">
                  <p className="text-gold-bright font-semibold">{promo.title}</p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{promo.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {plans.length > 0 && (
          <div id="memberships" className="mt-16 scroll-mt-28 border-t border-[var(--line-soft)] pt-14">
            <h2 className="display text-3xl text-[var(--ink)]">Memberships</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {plans.map((plan) => (
                <div key={plan._id} className="card p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="display text-2xl text-[var(--ink)]">{plan.name}</h3>
                    <p className="gold-text text-xl font-semibold">
                      {formatCad(plan.priceCents)}
                      <span className="text-sm font-normal text-[var(--ink-soft)]">
                        {" "}
                        /{plan.interval}
                      </span>
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-[var(--ink-soft)]">{plan.description}</p>
                  {plan.billingNote && (
                    <p className="mt-3 text-xs uppercase tracking-wider text-gold font-medium">
                      {plan.billingNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <Link href="/book" className="btn-primary">
            Book a service
          </Link>
        </div>
      </div>

      <JsonLd
        data={[
          serviceCatalogJsonLd(services),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
        ]}
      />
    </div>
  );
}
