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
  tagline: "Personalized skincare & lash artistry in West Edmonton.",
  description:
    "Mari Esthetics is a private home esthetics studio located in West Edmonton (Glastonbury / The Hamptons, T5T). Tailored facials, lash lifts, brow shaping and dermaplaning in a calm, one-on-one setting.",
  // Service-area business — city + region only, no street address published.
  locality: "Edmonton",
  region: "AB",
  regionName: "Alberta",
  country: "CA",
  neighbourhood: "Glastonbury / West Edmonton",
  postalCode: "T5T 6M5",
  // Geo coordinates centered on West Edmonton / Glastonbury (T5T 6M5 area)
  geo: { lat: 53.4975, lng: -113.6358 },
  areasServed: [
    "West Edmonton",
    "Glastonbury",
    "The Hamptons",
    "Granville",
    "Lewis Estates",
    "Secord",
    "Callingwood",
    "Windermere",
    "Spruce Grove",
  ],
  // Temporary WhatsApp number until the Canadian line is live.
  phone: "+50762639742",
  phoneDisplay: "+507 6263-9742",
  priceRange: "$$",
  currency: "CAD",
  // Temporary hours — confirm and update.
  hours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], open: "09:00", close: "20:00" },
  ],
  sameAs: [
    "https://www.instagram.com/mariesthetics",
    "https://www.facebook.com/mariesthetics",
  ],
} as const;

export const seoKeywords = [
  "esthetician West Edmonton",
  "facials Glastonbury Edmonton",
  "lash lift The Hamptons Edmonton",
  "dermaplaning West Edmonton",
  "home studio esthetician Edmonton T5T",
  "brow shaping West Edmonton",
  "esthetics studio Glastonbury",
  "skincare studio Edmonton T5T",
  "facial treatment Lewis Estates",
  "private esthetics studio West Edmonton",
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
    alternates: {
      canonical,
    },
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

export type ReviewSchemaItem = {
  author: string;
  rating: number;
  comment?: string;
  datePublished?: string;
};

export function localBusinessJsonLd(options?: {
  ratingValue?: number;
  reviewCount?: number;
  reviews?: ReviewSchemaItem[];
}) {
  const baseData: Record<string, unknown> = {
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
      postalCode: business.postalCode,
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

  if (options?.ratingValue && options?.reviewCount && options.reviewCount > 0) {
    baseData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: options.ratingValue.toFixed(1),
      reviewCount: options.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  if (options?.reviews && options.reviews.length > 0) {
    baseData.review = options.reviews.map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.author || "Verified Client",
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating || 5,
        bestRating: "5",
        worstRating: "1",
      },
      reviewBody: r.comment || "Exceptional service and beautiful results!",
      ...(r.datePublished ? { datePublished: r.datePublished } : {}),
    }));
  }

  return baseData;
}

export function individualServiceJsonLd(services: Array<{
  name: string;
  description?: string;
  priceCents: number;
  durationMin?: number;
  slug?: string;
}>) {
  return services.map((s) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: s.description || business.description,
    provider: { "@id": `${siteUrl}/#business` },
    areaServed: business.areasServed.map((name) => ({
      "@type": "City",
      name,
    })),
    url: s.slug ? `${siteUrl}/services#${s.slug}` : `${siteUrl}/services`,
    offers: {
      "@type": "Offer",
      priceCurrency: business.currency,
      price: (s.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/book`,
    },
  }));
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
