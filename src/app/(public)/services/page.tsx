import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { connectDb } from "@/lib/db/connect";
import { Category, Promotion, Service, ServiceImage, SubscriptionPlan } from "@/lib/db/models";
import { formatCad } from "@/lib/money";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/public/Reveal";
import {
  breadcrumbJsonLd,
  buildMetadata,
  individualServiceJsonLd,
  serviceCatalogJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Services & Pricing",
  description:
    "Explore customized facial treatments, dermaplaning, lash lifts, and brow shaping in Edmonton. Transparent pricing and instant online booking at Mari Esthetics.",
  path: "/services",
  keywords: [
    "facials Edmonton pricing",
    "lash lift Edmonton price",
    "brow shaping Edmonton",
    "dermaplaning Edmonton",
    "esthetics services Edmonton",
  ],
});

type ServiceItem = {
  _id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  depositCents: number;
  category: string;
  photos: string[];
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
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

type CategoryItem = {
  _id: string;
  name: string;
  slug: string;
  description: string;
};

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  facials: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800",
  facial: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800",
  lashes: "https://images.unsplash.com/photo-1583001809873-a1284d563572?auto=format&fit=crop&q=80&w=800",
  permanentMakeUp: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
  brows: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
  general: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
};

async function getData() {
  try {
    await connectDb();
    const [services, promotions, plans, serviceImages, categories] = await Promise.all([
      Service.find({ active: true }).sort({ sortOrder: 1 }).lean(),
      Promotion.find({
        active: true,
        startsAt: { $lte: new Date() },
        endsAt: { $gte: new Date() },
      }).lean(),
      SubscriptionPlan.find({ active: true }).lean(),
      ServiceImage.find({ isPrivate: false }).lean(),
      Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    ]);

    const imageMap = new Map<string, string[]>();
    for (const img of serviceImages as any[]) {
      const sId = String(img.serviceId);
      if (!imageMap.has(sId)) imageMap.set(sId, []);
      if (img.url) imageMap.get(sId)!.push(img.url);
    }

    return {
      offline: false,
      services: services.map((s: any) => {
        const sId = String(s._id);
        const uploadedPhotos = (s.photos && s.photos.length > 0) ? s.photos : (imageMap.get(sId) || []);
        return {
          _id: sId,
          name: String(s.name),
          description: String(s.description ?? ""),
          durationMin: Number(s.durationMin),
          priceCents: Number(s.priceCents),
          depositCents: Number(s.depositCents),
          category: String(s.category ?? "general"),
          photos: uploadedPhotos,
        };
      }) as ServiceItem[],
      promotions: promotions.map((p: any) => ({
        _id: String(p._id),
        title: String(p.title),
        description: String(p.description ?? ""),
      })) as Promo[],
      plans: plans.map((p: any) => ({
        _id: String(p._id),
        name: String(p.name),
        description: String(p.description ?? ""),
        interval: String(p.interval),
        priceCents: Number(p.priceCents),
        billingNote: p.billingNote ? String(p.billingNote) : undefined,
      })) as Plan[],
      categories: categories.map((c: any) => ({
        _id: String(c._id),
        name: String(c.name),
        slug: String(c.slug),
        description: String(c.description ?? ""),
      })) as CategoryItem[],
    };
  } catch {
    return { offline: true, services: [], promotions: [], plans: [], categories: [] };
  }
}

export default async function ServicesPage() {
  const { services, promotions, plans, categories: dbCategories, offline } = await getData();

  const categoryMap: Record<string, CategoryItem> = {};
  dbCategories.forEach((c) => {
    categoryMap[c.slug] = c;
  });

  const categories = Array.from(new Set(services.map((s) => s.category)));

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] min-h-screen">
      {/* Hero band */}
      <section className="aurora relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24 border-b border-[var(--border-color)]">
        <div className="grain absolute inset-0 opacity-10" />
        <div className="relative mx-auto max-w-6xl px-6 md:px-10 text-center sm:text-left">
          <p className="reveal eyebrow">Treatment Catalog &amp; Pricing</p>
          <h1 className="reveal reveal-delay-1 display mt-4 max-w-3xl text-4xl sm:text-5xl md:text-7xl text-[var(--ink)] tracking-tight">
            Curated Esthetics.
            <span className="gold-text italic block sm:inline"> Transparent Pricing.</span>
          </h1>
          <p className="reveal reveal-delay-2 mt-6 max-w-2xl text-sm sm:text-base text-[var(--ink-soft)] leading-relaxed">
            Every treatment is tailored to your unique skin & beauty goals in a private, serene Edmonton studio. A deposit secures your appointment; the balance is settled upon completion.
          </p>

          {/* Quick Anchor Bar */}
          {categories.length > 0 && (
            <div className="reveal reveal-delay-3 mt-10 flex flex-wrap items-center gap-2.5">
              {categories.map((c) => (
                <a key={c} href={`#${c}`} className="chip font-medium shadow-sm hover:scale-105 transition-all">
                  {categoryMap[c]?.name || c}
                </a>
              ))}
              {plans.length > 0 && (
                <a href="#memberships" className="chip font-medium border-[#c8a86b]/40 text-[#c8a86b] hover:bg-[#c8a86b]/10 shadow-sm">
                  ✨ Memberships
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 space-y-24">
        {offline && (
          <p className="rounded-2xl border border-blush/30 bg-blush/10 px-6 py-4 text-sm text-blush font-medium text-center">
            Connect MongoDB and run <code className="text-gold font-bold">npm run seed</code> to load live studio services.
          </p>
        )}

        {/* Category Sections */}
        {categories.map((category) => {
          const categoryServices = services.filter((s) => s.category === category);
          const catObj = categoryMap[category];
          const categoryTitle = catObj?.name || category;
          const categoryDesc = catObj?.description || "";

          return (
            <section key={category} id={category} className="scroll-mt-28 space-y-8">
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border-color)] pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#c8a86b]">
                    Category
                  </span>
                  <h2 className="display text-3xl sm:text-4xl text-[var(--ink)] mt-1">
                    {categoryTitle}
                  </h2>
                  {categoryDesc && (
                    <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-xl">
                      {categoryDesc}
                    </p>
                  )}
                </div>
                <p className="text-xs text-[var(--ink-soft)] font-medium">
                  {categoryServices.length} treatment{categoryServices.length === 1 ? "" : "s"} available
                </p>
              </div>

              {/* Spacious 2-Column Luxury Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {categoryServices.map((service) => {
                  const imageUrl =
                    service.photos && service.photos.length > 0
                      ? service.photos[0]
                      : CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.general;

                  return (
                    <Reveal
                      key={service._id}
                      className="group border border-[var(--border-color)] bg-[var(--card-bg)] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#c8a86b]/50 transition-all duration-500 flex flex-col justify-between min-h-[460px]"
                    >
                      {/* Service Image Frame */}
                      <div className="relative w-full h-64 sm:h-72 overflow-hidden bg-black/10">
                        <Image
                          src={imageUrl}
                          alt={service.name}
                          fill
                          unoptimized={imageUrl.includes("pinata") || imageUrl.includes("ipfs")}
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        {/* Badges on image */}
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                          <span className="bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
                            {category}
                          </span>
                          <span className="bg-[#c8a86b]/90 backdrop-blur-md text-[#24180a] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            ⏱ {service.durationMin} MINS
                          </span>
                        </div>

                        {/* Service Title over image gradient */}
                        <div className="absolute bottom-4 left-6 right-6">
                          <h3 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                            {service.name}
                          </h3>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                        <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                          {service.description || "A personalized beauty treatment crafted to enhance your natural features and revitalize your skin in a calm, luxurious setting."}
                        </p>

                        <div className="pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-faint)] block">
                              Deposit Required: {formatCad(service.depositCents)}
                            </span>
                            <span className="gold-text text-3xl font-bold tracking-tight">
                              {formatCad(service.priceCents)}
                            </span>
                          </div>

                          <Link
                            href={`/book?serviceId=${service._id}`}
                            className="btn-primary text-xs !py-3 !px-6 shadow-md hover:scale-105 transition-all"
                          >
                            Book Treatment →
                          </Link>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Current Offers Section */}
        {promotions.length > 0 && (
          <section className="border-t border-[var(--border-color)] pt-16 space-y-8">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#c8a86b]">
                Exclusive Specials
              </span>
              <h2 className="display text-3xl sm:text-4xl text-[var(--ink)] mt-1">
                Current Offers &amp; Promotions
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {promotions.map((promo) => (
                <div
                  key={promo._id}
                  className="border border-[#c8a86b]/40 bg-gradient-to-br from-[#c8a86b]/[0.08] to-transparent p-8 rounded-3xl space-y-3 shadow-sm"
                >
                  <span className="text-xs uppercase tracking-wider font-bold text-[#c8a86b]">
                    Limited Time Offer
                  </span>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                    {promo.title}
                  </h3>
                  <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                    {promo.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Memberships Section */}
        {plans.length > 0 && (
          <section id="memberships" className="scroll-mt-28 border-t border-[var(--border-color)] pt-16 space-y-8">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#c8a86b]">
                Recurring Care
              </span>
              <h2 className="display text-3xl sm:text-4xl text-[var(--ink)] mt-1">
                Studio Memberships
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className="border border-[var(--border-color)] bg-[var(--card-bg)] p-8 rounded-3xl flex flex-col justify-between space-y-6 shadow-sm hover:border-[#c8a86b]/40 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                        {plan.name}
                      </h3>
                      <p className="gold-text text-2xl font-bold">
                        {formatCad(plan.priceCents)}
                        <span className="text-xs font-normal text-[var(--ink-soft)]">
                          {" "}
                          /{plan.interval}
                        </span>
                      </p>
                    </div>
                    <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {plan.billingNote && (
                    <p className="text-xs uppercase tracking-wider text-[#c8a86b] font-semibold border-t border-[var(--border-color)] pt-4">
                      ✓ {plan.billingNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Booking CTA Banner */}
        <div className="border border-[var(--border-color)] bg-gradient-to-r from-[#c8a86b]/[0.08] via-transparent to-[#c8a86b]/[0.08] p-10 rounded-3xl text-center space-y-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-[var(--ink)]">
            Ready for your personalized esthetics experience?
          </h2>
          <p className="text-sm text-[var(--ink-soft)] max-w-xl mx-auto">
            Book your appointment online in seconds. A deposit reserves your private session.
          </p>
          <Link href="/book" className="btn-primary inline-flex text-xs px-8 py-3.5 shadow-lg">
            Book an Appointment Now
          </Link>
        </div>
      </div>

      <JsonLd
        data={[
          serviceCatalogJsonLd(services),
          ...individualServiceJsonLd(services),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
        ]}
      />
    </div>
  );
}
