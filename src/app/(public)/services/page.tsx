import type { Metadata } from "next";
import { connectDb } from "@/lib/db/connect";
import { Category, Promotion, Service, ServiceImage, SubscriptionPlan } from "@/lib/db/models";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbJsonLd,
  buildMetadata,
  individualServiceJsonLd,
  serviceCatalogJsonLd,
} from "@/lib/seo";
import { ServicesContent } from "@/components/public/sections/ServicesContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Services & Pricing",
  description:
    "Explore customized facials, lash extensions, powder brows, and lip blush in Edmonton. Transparent pricing and instant online booking at Mari Esthetics.",
  path: "/services",
  keywords: [
    "facials Edmonton pricing",
    "lash extensions Edmonton price",
    "powder brows Edmonton price",
    "lip blush Edmonton price",
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
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  nameTranslations?: Record<string, string>;
  descriptionTranslations?: Record<string, string>;
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

async function getData() {
  try {
    await connectDb();
    // ⚡ Bolt Optimization: Add field projections (.select) to prevent over-fetching unused properties and reduce payload overhead.
    const [services, promotions, plans, serviceImages, categories] = await Promise.all([
      Service.find({ active: true })
        .select("name description durationMin priceCents depositCents category photos nameTranslations descriptionTranslations")
        .sort({ sortOrder: 1 })
        .lean(),
      Promotion.find({
        active: true,
        startsAt: { $lte: new Date() },
        endsAt: { $gte: new Date() },
      })
        .select("title description")
        .lean(),
      SubscriptionPlan.find({ active: true }).populate("includedServiceIds", "name priceCents").lean(),
      ServiceImage.find({ isPrivate: false }).select("serviceId url").lean(),
      Category.find({ active: true })
        .select("name slug description")
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
    ]);

    const imageMap = new Map<string, string[]>();
    for (const img of serviceImages as Array<Record<string, unknown>>) {
      const sId = String(img.serviceId);
      if (!imageMap.has(sId)) imageMap.set(sId, []);
      if (img.url) imageMap.get(sId)!.push(String(img.url));
    }

    return {
      offline: false,
      services: services.map((s: Record<string, unknown>) => {
        const sId = String(s._id);
        const photosArr = Array.isArray(s.photos) ? s.photos.map(String) : [];
        const uploadedPhotos = (photosArr.length > 0) ? photosArr : (imageMap.get(sId) || []);
        return {
          _id: sId,
          name: String(s.name),
          description: String(s.description ?? ""),
          durationMin: Number(s.durationMin),
          priceCents: Number(s.priceCents),
          depositCents: Number(s.depositCents),
          category: String(s.category ?? "general"),
          photos: uploadedPhotos,
          nameTranslations: s.nameTranslations as Record<string, string> | undefined,
          descriptionTranslations: s.descriptionTranslations as Record<string, string> | undefined,
        };
      }) as ServiceItem[],
      promotions: promotions.map((p: Record<string, unknown>) => ({
        _id: String(p._id),
        title: String(p.title),
        description: String(p.description ?? ""),
      })) as Promo[],
      plans: plans.map((p: Record<string, unknown>) => {
        const coveredServices = ((p.includedServiceIds as unknown[]) || [])
          .map((srv: unknown) => {
            if (typeof srv === "object" && srv !== null && "name" in srv) {
              const obj = srv as Record<string, unknown>;
              return {
                _id: String(obj._id),
                name: String(obj.name),
                priceCents: Number(obj.priceCents || 0),
              };
            }
            const srvId = typeof srv === "object" && srv !== null ? String((srv as Record<string, unknown>)._id || srv) : String(srv);
            const matched = (services as Array<Record<string, unknown>>).find((s) => String(s._id) === srvId);
            if (matched) {
              return {
                _id: String(matched._id),
                name: String(matched.name),
                priceCents: Number(matched.priceCents || 0),
              };
            }
            return null;
          })
          .filter(Boolean);

        return {
          _id: String(p._id),
          name: String(p.name),
          description: String(p.description ?? ""),
          interval: String(p.interval),
          priceCents: Number(p.priceCents),
          billingNote: p.billingNote ? String(p.billingNote) : undefined,
          visitsPerPeriod: Number(p.visitsPerPeriod || 1),
          includedServiceIds: coveredServices,
        };
      }) as Plan[],
      categories: categories.map((c: Record<string, unknown>) => ({
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
  const { services, plans, categories: dbCategories, offline } = await getData();

  return (
    <>
      <ServicesContent
        services={services}
        plans={plans}
        dbCategories={dbCategories}
        offline={offline}
      />
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
    </>
  );
}
