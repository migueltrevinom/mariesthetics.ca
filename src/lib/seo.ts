import type { Metadata } from "next";

/**
 * Central SEO configuration for Mari Esthetics.
 * Service-area business: we surface the city + neighbourhood for local ranking
 * but do NOT publish the exact street address (home studio). The precise
 * address is only shared with clients after booking.
 */

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mariesthetics.ca"
).replace(/\/$/, "");

export const business = {
  name: "Mari Esthetics",
  legalName: "Mari Esthetics",
  tagline: "Edmonton skin care, tailored to you.",
  description:
    "Mari Esthetics is a private esthetics studio serving Edmonton, Alberta. Personalized facials, lash lifts, brow shaping and dermaplaning in a calm, one-on-one setting.",
  // Service-area business — city + region only, no street address published.
  locality: "Edmonton",
  region: "AB",
  regionName: "Alberta",
  country: "CA",
  neighbourhood: "West Edmonton",
  // Approximate geo for the service area (Edmonton centre) — not the home address.
  geo: { lat: 53.5461, lng: -113.4938 },
  areasServed: [
    "Edmonton",
    "West Edmonton",
    "St. Albert",
    "Sherwood Park",
    "Spruce Grove",
    "Stony Plain",
  ],
  // Temporary WhatsApp number until the Canadian line is live.
  phone: "+50762639742",
  phoneDisplay: "+507 6263-9742",
  priceRange: "$$",
  currency: "CAD",
  // Placeholder hours — confirm and update.
  hours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], open: "09:00", close: "20:00" },
  ],
  sameAs: [
    "https://www.instagram.com/mariesthetics",
    "https://www.facebook.com/mariesthetics",
  ],
} as const;

export const seoKeywords = [
  "esthetician Edmonton",
  "esthetics Edmonton",
  "facials Edmonton",
  "lash lift Edmonton",
  "brow shaping Edmonton",
  "dermaplaning Edmonton",
  "Edmonton skin care studio",
  "skin care Edmonton",
  "eyelash lift Edmonton",
  "home studio esthetician Edmonton",
];

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  noindex?: boolean;
  ogImage?: string;
};

export function buildMetadata({
  title,
  description = business.description,
  path = "/",
  keywords,
  noindex = false,
  ogImage,
}: BuildMetadataInput = {}): Metadata {
  const canonical = `${siteUrl}${path === "/" ? "" : path}`;
  const fullTitle = title ? `${title} · ${business.name}` : `${business.name} · Edmonton Esthetics Studio`;

  return {
    title: title ?? undefined,
    description,
    keywords: keywords ?? seoKeywords,
    alternates: { canonical },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type: "website",
      siteName: business.name,
      title: fullTitle,
      description,
      url: canonical,
      locale: "en_CA",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

function openingHoursSpec() {
  return business.hours.map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.days,
    opens: h.open,
    closes: h.close,
  }));
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "@id": `${siteUrl}/#business`,
    name: business.name,
    description: business.description,
    url: siteUrl,
    telephone: business.phone,
    priceRange: business.priceRange,
    currenciesAccepted: business.currency,
    image: `${siteUrl}/opengraph-image`,
    // Service-area business: address limited to city/region, no street.
    address: {
      "@type": "PostalAddress",
      addressLocality: business.locality,
      addressRegion: business.region,
      addressCountry: business.country,
    },
    areaServed: business.areasServed.map((name) => ({
      "@type": "City",
      name,
    })),
    geo: {
      "@type": "GeoCoordinates",
      latitude: business.geo.lat,
      longitude: business.geo.lng,
    },
    openingHoursSpecification: openingHoursSpec(),
    sameAs: business.sameAs,
  };
}

export function serviceCatalogJsonLd(
  services: Array<{
    name: string;
    description?: string;
    priceCents: number;
    durationMin?: number;
  }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `${business.name} Services`,
    itemListElement: services.map((s) => ({
      "@type": "Offer",
      priceCurrency: business.currency,
      price: (s.priceCents / 100).toFixed(2),
      itemOffered: {
        "@type": "Service",
        name: s.name,
        description: s.description,
        provider: { "@id": `${siteUrl}/#business` },
        areaServed: business.locality,
      },
    })),
  };
}

export function faqJsonLd(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.path === "/" ? "" : item.path}`,
    })),
  };
}
