import type { Locale } from "@/components/i18n/LanguageContext";
import { SERVICE_LANDING_PAGES } from "./registry";
import { normalizeServiceLandingSlugParam } from "./paths";
import type { LandingDefinition, ResolvedLanding } from "./types";

const LOCALES: Locale[] = ["en", "es", "tl", "pa", "ar"];

export function landingSlugForLocale(def: LandingDefinition, locale: Locale): string {
  return def.slugs[locale] || def.slugs.en;
}

export function resolveLandingBySlugParam(rawSlug: string): ResolvedLanding | null {
  const normalized = normalizeServiceLandingSlugParam(rawSlug);
  if (!normalized) return null;

  for (const def of SERVICE_LANDING_PAGES) {
    for (const locale of LOCALES) {
      const candidate = normalizeServiceLandingSlugParam(def.slugs[locale]);
      if (candidate === normalized) {
        return {
          definition: def,
          locale,
          pathSlug: def.slugs[locale],
        };
      }
    }
  }
  return null;
}

import { siteUrl } from "@/lib/seo";
import { localeToHreflang } from "@/lib/blog/locales";
import { serviceLandingPath } from "./paths";

export function hreflangAlternatesForLanding(def: LandingDefinition): Record<string, string> {

  const map: Record<string, string> = {};
  for (const locale of LOCALES) {
    const segment = def.slugs[locale];
    if (!segment) continue;
    map[localeToHreflang(locale)] = `${siteUrl}${serviceLandingPath(segment)}`;
  }
  map["x-default"] = `${siteUrl}${serviceLandingPath(def.slugs.en)}`;
  return map;
}

const FACIAL_DEDICATED_SLUGS = new Set([
  "hydra-facial",
  "anti-aging-facial",
  "deep-cleansing-facial",
]);

export function landingDefinitionForService(service: {
  category: string;
  slug: string;
}): LandingDefinition | undefined {
  for (const def of SERVICE_LANDING_PAGES) {
    if (def.match.type === "serviceSlugs" && def.match.slugs.includes(service.slug)) {
      return def;
    }
  }
  if (service.category === "lashes") {
    return SERVICE_LANDING_PAGES.find((d) => d.key === "lash-extensions");
  }
  if (service.slug === "basic-facial") {
    return SERVICE_LANDING_PAGES.find((d) => d.key === "facial-west");
  }
  if (service.category === "facials" && !FACIAL_DEDICATED_SLUGS.has(service.slug)) {
    return SERVICE_LANDING_PAGES.find((d) => d.key === "facial-west");
  }
  return undefined;
}

export function slugsByLocaleForLanding(def: LandingDefinition): Partial<Record<Locale, string>> {
  const out: Partial<Record<Locale, string>> = {};
  for (const locale of LOCALES) {
    out[locale] = def.slugs[locale];
  }
  return out;
}
