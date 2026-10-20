import type { Metadata } from "next";
import { blogPostPath } from "@/lib/blog/slug";

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
    "Mari Esthetics is a private home esthetics studio located in West Edmonton (Glastonbury / The Hamptons, T5T). Tailored facials, lash extensions, powder brows and lip blush in a calm, one-on-one setting.",
  // Service-area business — city + region only, no street address published.
  // Published in structured data only (approved by Miguel); the UI still shares it after booking.
  streetAddress: "1211 Gillespie Crescent NW",
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
  phone: "+18257853081",
  phoneDisplay: "+1 (825) 785-3081",
  priceRange: "$$",
  currency: "CAD",
  sameAs: [
    "https://www.instagram.com/mariestheticsyeg",
  ],
} as const;

export const seoKeywords = [
  "esthetician West Edmonton",
  "facials Glastonbury Edmonton",
  "lash extensions The Hamptons Edmonton",
  "hydra facial West Edmonton",
  "home studio esthetician Edmonton T5T",
  "powder brows West Edmonton",
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
  ogType?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  hreflangAlternates?: Record<string, string>;
  ogLocale?: string;
  /** Use the title as-is (no " · Mari Esthetics" template suffix), e.g. when it is already long. */
  absoluteTitle?: boolean;
};

export function stripBrandSuffix(title?: string): string | undefined {
  if (!title) return title;
  const brand = business.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stripped = title.replace(new RegExp(`\\s*[|·\\-–—:]\\s*${brand}\\s*$`, "i"), "").trim();
  return stripped || title;
}

export function buildMetadata({
  title,
  description = business.description,
  path = "/",
  keywords,
  noindex = false,
  ogImage,
  ogType = "website",
  publishedTime,
  modifiedTime,
  authors,
  hreflangAlternates,
  ogLocale = "en_CA",
  absoluteTitle = false,
}: BuildMetadataInput = {}): Metadata {
  // The root layout template appends " · Mari Esthetics"; drop a brand suffix that
  // content already carries so the name never appears twice.
  title = stripBrandSuffix(title);
  const canonical = `${siteUrl}${path === "/" ? "" : path}`;
  const fullTitle = title
    ? absoluteTitle
      ? title
      : `${title} · ${business.name}`
    : `${business.name} · Edmonton Esthetics Studio`;
  const ogImages = ogImage
    ? [{ url: ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}` }]
    : [{ url: `${siteUrl}/opengraph-image` }];

  return {
    // Omit the key entirely when no page title is given, so the root layout's
    // default title still applies (an explicit undefined removes <title>).
    ...(title ? { title: absoluteTitle ? { absolute: title } : title } : {}),
    description,
    keywords: keywords ?? seoKeywords,
    alternates: {
      canonical,
      ...(hreflangAlternates && Object.keys(hreflangAlternates).length > 0
        ? { languages: hreflangAlternates }
        : {}),
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type: ogType,
      siteName: business.name,
      title: fullTitle,
      description,
      url: canonical,
      locale: ogLocale,
      images: ogImages,
      ...(ogType === "article" && publishedTime ? { publishedTime } : {}),
      ...(ogType === "article" && modifiedTime ? { modifiedTime } : {}),
      ...(ogType === "article" && authors?.length ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ogImages.map((i) => i.url),
    },
  };
}

export function articleJsonLd(post: {
  title: string;
  description: string;
  slug: string;
  coverImage?: string;
  author?: string;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  inLanguage?: string;
}) {
  const url = `${siteUrl}${blogPostPath(post.slug)}`;
  const image = post.coverImage
    ? post.coverImage.startsWith("http")
      ? post.coverImage
      : `${siteUrl}${post.coverImage}`
    : `${siteUrl}/opengraph-image`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: [image],
    inLanguage: post.inLanguage || "en-CA",
    author: {
      "@type": "Person",
      name: post.author || "Marinelle Tala",
    },
    publisher: {
      "@type": ["Organization", "HealthAndBeautyBusiness"],
      name: business.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: business.locality,
        addressRegion: business.region,
        addressCountry: business.country,
      },
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/images/logo/mari-logo-full.svg`,
      },
    },
    about: { "@id": `${siteUrl}/#business` },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    url,
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.modifiedAt ? { dateModified: post.modifiedAt } : {}),
  };
}

export type ReviewSchemaItem = {
  author: string;
  rating: number;
  comment?: string;
  datePublished?: string;
};

export function localBusinessJsonLd(options?: {
  /** From the admin weekly schedule (getOpeningHoursSpec); omitted when unknown. */
  openingHours?: object[];
  ratingValue?: number;
  reviewCount?: number;
  reviews?: ReviewSchemaItem[];
}) {
  const baseData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "@id": `${siteUrl}/#business`,
    alternateName: "Mari Esthetics West Edmonton",
    name: business.name,
    description: business.description,
    url: siteUrl,
    telephone: business.phone,
    priceRange: business.priceRange,
    currenciesAccepted: business.currency,
    image: `${siteUrl}/opengraph-image`,
    address: {
      "@type": "PostalAddress",
      addressLocality: business.locality,
      streetAddress: business.streetAddress,
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
    ...(options?.openingHours?.length ? { openingHoursSpecification: options.openingHours } : {}),
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

  const realReviews = (options?.reviews || []).filter((r) => r.comment && r.comment.trim());
  if (realReviews.length > 0) {
    baseData.review = realReviews.map((r) => ({
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
      reviewBody: r.comment,
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

export function serviceLandingJsonLd(input: {
  name: string;
  description: string;
  url: string;
  image?: string;
  offers: Array<{ name: string; priceCents: number; id?: string }>;
}) {
  const image = input.image
    ? input.image.startsWith("http")
      ? input.image
      : `${siteUrl}${input.image}`
    : `${siteUrl}/opengraph-image`;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    provider: { "@id": `${siteUrl}/#business` },
    areaServed: business.areasServed.map((name) => ({
      "@type": "City",
      name,
    })),
    image,
    url: input.url,
    offers: input.offers.map((o) => ({
      "@type": "Offer",
      name: o.name,
      priceCurrency: business.currency,
      price: (o.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: o.id ? `${siteUrl}/book?serviceId=${o.id}` : `${siteUrl}/book`,
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

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
  options?: { inLanguage?: string }
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    inLanguage: options?.inLanguage || "en-CA",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.path === "/" ? "" : item.path}`,
    })),
  };
}
