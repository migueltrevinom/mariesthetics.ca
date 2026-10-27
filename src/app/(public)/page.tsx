import { getOpeningHoursSpec } from "@/lib/businessHours";
import type { Metadata } from "next";
import { connectDb } from "@/lib/db/connect";
import { Review, Service, SubscriptionPlan } from "@/lib/db/models";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  hreflangForSinglePath,
  localBusinessJsonLd,
  type ReviewSchemaItem,
} from "@/lib/seo";
import { buildHomeFaq, HOME_DESCRIPTION, HOME_FAQ_HEADING, HOME_TITLE, type HomePrices } from "@/lib/home/seo";
import { getGoogleReviews } from "@/lib/googleReviews";
import { computeHomePrices } from "@/lib/home/prices";
import { HomeLinks } from "@/components/public/sections/HomeLinks";
import { loadReadMinutes, loadTreatmentGuideCards } from "@/lib/home/treatmentGuidesData";
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
import { pickVolumePair } from "@/lib/services/landing/volumeMatch";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return buildMetadata({
    title: HOME_TITLE[locale] || HOME_TITLE.en,
    description: HOME_DESCRIPTION[locale] || HOME_DESCRIPTION.en,
    path: "/",
    hreflangAlternates: hreflangForSinglePath("/"),
  });
}

async function getVolumeOffer(): Promise<{ setCents?: number; fillCents?: number }> {
  try {
    await connectDb();
    const rows = (await Service.find({ active: true, category: "lashes" }).select("name slug priceCents").lean()) as Array<{
      name?: string;
      slug?: string;
      priceCents?: number;
    }>;
    const pair = pickVolumePair(
      rows.map((r) => ({
        name: String(r.name || ""),
        slug: String(r.slug || ""),
        category: "lashes",
        priceCents: Number(r.priceCents) || 0,
      }))
    );
    return {
      ...(pair.set?.priceCents ? { setCents: pair.set.priceCents } : {}),
      ...(pair.fill?.priceCents ? { fillCents: pair.fill.priceCents } : {}),
    };
  } catch {
    return {};
  }
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
        reviewCount,
        reviews: reviewItems,
      },
    };
  } catch {
    return {
      services: [],
      plans: [],
      reviewStats: { ratingValue: 0, reviewCount: 0, reviews: [] },
    };
  }
}

export default async function HomePage() {
  const { services, plans, reviewStats } = await getData();
  const locale = await getServerLocale();
  const [latestPosts, prices, google, guideCards, volumeOffer] = await Promise.all([
    getLatestPublishedPosts(locale, 3),
    getHomePrices(),
    getGoogleReviews(),
    loadTreatmentGuideCards(),
    getVolumeOffer(),
  ]);
  const readMinutes = await loadReadMinutes(latestPosts.map((p) => p._id));
  // Prefer the real Google Business Profile aggregate; else real site reviews; else omit.
  const aggregate = google
    ? { ratingValue: google.rating, reviewCount: google.userRatingCount }
    : reviewStats.reviewCount > 0
      ? { ratingValue: reviewStats.ratingValue, reviewCount: reviewStats.reviewCount }
      : {};
  const homeFaq = buildHomeFaq(locale, prices);
  const faqHeading = HOME_FAQ_HEADING[locale] || HOME_FAQ_HEADING.en;

  return (
    <>
      <Hero volume={volumeOffer} />
      <ServicesPreview services={services} />
      <HowItWorks />
      <MembershipBand plans={plans} />
      <BlogPreview posts={latestPosts} />
      <Testimonials google={google} />
      <SocialReels />
      <HomeLinks locale={locale} posts={latestPosts} cards={guideCards} readMinutes={readMinutes} />
      <Faq items={homeFaq} eyebrow={faqHeading.eyebrow} title={faqHeading.title} />
      <CtaBand />
      <JsonLd
        data={[
          localBusinessJsonLd({
            openingHours: await getOpeningHoursSpec(),
            ...aggregate,
            reviews: reviewStats.reviews,
          }),
          { ...faqJsonLd(homeFaq), inLanguage: localeToHreflang(locale) },
          breadcrumbJsonLd([{ name: "Home", path: "/" }]),
        ]}
      />
    </>
  );
}
