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

import { getFastIpfsUrl } from "@/lib/ipfs";

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
      SubscriptionPlan.find({ active: true }).populate("includedServiceIds", "name priceCents").lean(),
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
          nameTranslations: s.nameTranslations || undefined,
          descriptionTranslations: s.descriptionTranslations || undefined,
        };
      }) as ServiceItem[],
      promotions: promotions.map((p: any) => ({
        _id: String(p._id),
        title: String(p.title),
        description: String(p.description ?? ""),
      })) as Promo[],
      plans: plans.map((p: any) => {
        const coveredServices = (p.includedServiceIds || [])
          .map((srv: any) => {
            if (typeof srv === "object" && srv !== null && srv.name) {
              return {
                _id: String(srv._id),
                name: String(srv.name),
                priceCents: Number(srv.priceCents || 0),
              };
            }
            const srvId = typeof srv === "object" && srv !== null ? String(srv._id || srv) : String(srv);
            const matched = (services as any[]).find((s: any) => String(s._id) === srvId);
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

import { ServicesContent } from "@/components/public/sections/ServicesContent";

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
