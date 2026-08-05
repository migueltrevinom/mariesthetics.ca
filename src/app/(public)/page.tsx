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
import { faqItems } from "@/lib/faq";
import { Hero } from "@/components/public/sections/Hero";
import { ServicesPreview } from "@/components/public/sections/ServicesPreview";
import { HowItWorks } from "@/components/public/sections/HowItWorks";
import { MembershipBand } from "@/components/public/sections/MembershipBand";
import { Testimonials } from "@/components/public/sections/Testimonials";
import { SocialReels } from "@/components/public/sections/SocialReels";
import { Faq } from "@/components/public/sections/Faq";
import { CtaBand } from "@/components/public/sections/CtaBand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  description:
    "Mari Esthetics is a private esthetics studio serving Edmonton, AB — personalized facials, lash lifts, brow shaping and dermaplaning. Book online with an easy deposit.",
  path: "/",
});

type PreviewService = {
  _id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
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
      Service.find({ active: true }).sort({ sortOrder: 1 }).limit(3).lean(),
      SubscriptionPlan.find({ active: true }).limit(2).lean(),
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
      services: services.map((s) => ({
        _id: String(s._id),
        name: String(s.name),
        description: String(s.description ?? ""),
        durationMin: Number(s.durationMin),
        priceCents: Number(s.priceCents),
      })),
      plans: plans.map((p) => ({
        _id: String(p._id),
        name: String(p.name),
        description: String(p.description ?? ""),
        interval: String(p.interval),
        priceCents: Number(p.priceCents),
        billingNote: p.billingNote ? String(p.billingNote) : undefined,
      })),
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

  return (
    <>
      <Hero />
      <ServicesPreview services={services} />
      <HowItWorks />
      <MembershipBand plans={plans} />
      <Testimonials />
      <SocialReels />
      <Faq />
      <CtaBand />
      <JsonLd
        data={[
          localBusinessJsonLd({
            ratingValue: reviewStats.ratingValue,
            reviewCount: reviewStats.reviewCount,
            reviews: reviewStats.reviews,
          }),
          faqJsonLd(faqItems.map((f) => ({ q: f.q, a: f.a }))),
          breadcrumbJsonLd([{ name: "Home", path: "/" }]),
        ]}
      />
    </>
  );
}
