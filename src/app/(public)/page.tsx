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
    // ⚡ Bolt Optimization: Use MongoDB aggregation for review stats ($avg, $sum) and limit JSON-LD schema reviews to top 10 with field selection.
    // Avoids fetching all historical reviews into Node memory on every landing page request.
    const [services, plans, reviewAgg, latestReviews] = await Promise.all([
      Service.find({ active: true })
        .select("name description durationMin priceCents depositCents category photos")
        .sort({ sortOrder: 1 })
        .limit(6)
        .lean(),
      SubscriptionPlan.find({ active: true }).populate("includedServiceIds", "name priceCents").limit(2).lean(),
      Review.aggregate([
        { $match: { status: "submitted" } },
        { $group: { _id: null, ratingValue: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
      ]),
      Review.find({ status: "submitted" })
        .select("guest.name rating comment submittedAt")
        .sort({ submittedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const reviewCount = reviewAgg[0]?.reviewCount || 0;
    const ratingValue = reviewAgg[0]?.ratingValue || 5;

    const reviewItems: ReviewSchemaItem[] = (latestReviews as any[]).map((r) => ({
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
