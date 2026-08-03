import type { Metadata } from "next";
import { connectDb } from "@/lib/db/connect";
import { Service, SubscriptionPlan } from "@/lib/db/models";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
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

async function getData(): Promise<{ services: PreviewService[]; plans: Plan[] }> {
  try {
    await connectDb();
    const [services, plans] = await Promise.all([
      Service.find({ active: true }).sort({ sortOrder: 1 }).limit(3).lean(),
      SubscriptionPlan.find({ active: true }).limit(2).lean(),
    ]);
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
    };
  } catch {
    return { services: [], plans: [] };
  }
}

export default async function HomePage() {
  const { services, plans } = await getData();

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
          faqJsonLd(faqItems.map((f) => ({ q: f.q, a: f.a }))),
          breadcrumbJsonLd([{ name: "Home", path: "/" }]),
        ]}
      />
    </>
  );
}
