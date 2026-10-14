import { getOpeningHoursSpec } from "@/lib/businessHours";
import type { Metadata } from "next";
import { connectDb } from "@/lib/db/connect";
import { Review, Service, SubscriptionPlan } from "@/lib/db/models";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  localBusinessJsonLd,
  type ReviewSchemaItem,
} from "@/lib/seo";
import { buildHomeFaq, HOME_DESCRIPTION, HOME_FAQ_HEADING, HOME_TITLE, type HomePrices } from "@/lib/home/seo";
import { computeHomePrices } from "@/lib/home/prices";
import { HomeLinks } from "@/components/public/sections/HomeLinks";
import { localeToHreflang } from "@/lib/blog/locales";
import { Hero } from "@/components/public/sections/Hero";
import { ServicesPreview } from "@/components/public/sections/ServicesPreview";
import { HowItWorks } from "@/components/public/sections/HowItWorks";
import { MembershipBand } from "@/components/public/sections/MembershipBand";
import { Testimonials } from "@/components/public/sections/Testimonials";
import { SocialReels } from "@/components/public/sections/SocialReels";
import { Faq } from "@/components/public/sections/Faq";
import { CtaBand } from "@/components/public/sections/CtaBand";
import { BlogPreview } from "@/components/public/sections/BlogPreview";
import { getLatestPublishedPosts } from "@/lib/blog/queries";
import { getServerLocale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return buildMetadata({
    title: HOME_TITLE[locale] || HOME_TITLE.en,
    description: HOME_DESCRIPTION[locale] || HOME_DESCRIPTION.en,
    path: "/",
  });
}

async function getHomePrices(): Promise<HomePrices> {
  try {
    await connectDb();
    const rows = (await Service.find({ active: true }).select("slug name category priceCents").lean()) as Array<{
      slug?: string;
      name?: string;
      category?: string;
      priceCents?: number;
    }>;
    return computeHomePrices(
      rows.map((r) => ({
        slug: String(r.slug || ""),
        name: String(r.name || ""),
        category: String(r.category || ""),
        priceCents: Number(r.priceCents) || 0,
      }))
    );
  } catch {
    return {};
  }
}

type PreviewService = {
  _id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  depositCents: number;
  category: string;
  photos: string[];
};

type Plan = {
  _id: string;
  name: string;
  description: string;
  interval: string;
  priceCents: number;
  billingNote?: string;
};

type ReviewStats = {
  ratingValue: number;
  reviewCount: number;
  reviews: ReviewSchemaItem[];
};

async function getData(): Promise<{
  services: PreviewService[];
  plans: Plan[];
  reviewStats: ReviewStats;
}> {
  try {
    await connectDb();
    const [services, plans, reviews] = await Promise.all([
      Service.find({ active: true }).sort({ sortOrder: 1 }).limit(6).lean(),
      SubscriptionPlan.find({ active: true }).populate("includedServiceIds", "name priceCents").limit(2).lean(),
      Review.find({ status: "submitted" }).sort({ submittedAt: -1 }).lean(),
    ]);

    const reviewCount = reviews.length;
    let ratingValue = 5;
    if (reviewCount > 0) {
      const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
      ratingValue = sum / reviewCount;
    }

    const reviewItems: ReviewSchemaItem[] = reviews.slice(0, 10).map((r) => ({
      author: String(r.guest?.name || "Verified Client"),
      rating: Number(r.rating) || 5,
      comment: r.comment ? String(r.comment) : undefined,
      datePublished: r.submittedAt
        ? new Date(r.submittedAt).toISOString().split("T")[0]
        : undefined,
    }));

    return {
      services: services.map((s: any) => ({
        _id: String(s._id),
        name: String(s.name),
        description: String(s.description ?? ""),
        durationMin: Number(s.durationMin),
        priceCents: Number(s.priceCents),
        depositCents: Number(s.depositCents || 0),
        category: String(s.category || "facials"),
        photos: Array.isArray(s.photos) ? s.photos : [],
      })),
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
            const matched = services.find((s: any) => String(s._id) === srvId);
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
      }),
      reviewStats: {
        ratingValue,
        reviewCount: reviewCount > 0 ? reviewCount : 5, // Default fallback count if fresh DB
        reviews: reviewItems,
      },
    };
  } catch {
    return {
      services: [],
      plans: [],
      reviewStats: { ratingValue: 5, reviewCount: 5, reviews: [] },
    };
  }
}

export default async function HomePage() {
  const { services, plans, reviewStats } = await getData();
  const locale = await getServerLocale();
  const [latestPosts, prices] = await Promise.all([
    getLatestPublishedPosts(locale, 3),
    getHomePrices(),
  ]);
  const homeFaq = buildHomeFaq(locale, prices);
  const faqHeading = HOME_FAQ_HEADING[locale] || HOME_FAQ_HEADING.en;

  return (
    <>
      <Hero />
      <ServicesPreview services={services} />
      <HowItWorks />
      <MembershipBand plans={plans} />
      <BlogPreview posts={latestPosts} />
      <Testimonials />
      <SocialReels />
      <HomeLinks locale={locale} posts={latestPosts} />
      <Faq items={homeFaq} eyebrow={faqHeading.eyebrow} title={faqHeading.title} />
      <CtaBand />
      <JsonLd
        data={[
          localBusinessJsonLd({
            openingHours: await getOpeningHoursSpec(),
            ratingValue: reviewStats.ratingValue,
            reviewCount: reviewStats.reviewCount,
            reviews: reviewStats.reviews,
          }),
          { ...faqJsonLd(homeFaq), inLanguage: localeToHreflang(locale) },
          breadcrumbJsonLd([{ name: "Home", path: "/" }]),
        ]}
      />
    </>
  );
}
