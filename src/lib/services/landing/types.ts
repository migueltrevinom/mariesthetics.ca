import type { Locale } from "@/components/i18n/LanguageContext";

export type LandingKey =
  | "lash-extensions"
  | "powder-brows"
  | "lip-blush"
  | "lip-neutralization"
  | "facial-west"
  | "hydra-facial"
  | "anti-aging-facial"
  | "deep-cleansing-facial";

export type LandingMatch =
  | { type: "category"; category: string }
  | { type: "serviceSlugs"; slugs: string[] };

export type LandingDefinition = {
  key: LandingKey;
  match: LandingMatch;
  /** Preferred service for hero image / primary CTA when multiple match */
  heroServiceSlug: string;
  slugs: Record<Locale, string>;
};

export type LandingFaq = { q: string; a: string };

export type LandingContent = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  intro: string[];
  whatToExpect: string[];
  aftercare: string[];
  faqs: LandingFaq[];
  pricingHeading: string;
  relatedBlogHeading: string;
  locationLinkLabel: string;
  bookCta: string;
  allServicesLabel: string;
};

export type ResolvedLanding = {
  definition: LandingDefinition;
  locale: Locale;
  pathSlug: string;
};
