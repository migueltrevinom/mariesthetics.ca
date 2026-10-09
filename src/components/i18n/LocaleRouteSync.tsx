"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage, type Locale } from "@/components/i18n/LanguageContext";
import { useBlogTranslationSlugs } from "@/components/blog/BlogTranslationContext";
import { blogPostPath, normalizeBlogSlugForLookup } from "@/lib/blog/slug";
import { useServiceLandingSlugs } from "@/components/services/ServiceLandingTranslationContext";
import { serviceLandingPath } from "@/lib/services/landing/paths";
import { normalizeServiceLandingSlugParam } from "@/lib/services/landing/paths";

/**
 * Keeps server-rendered blog/home content in sync with the client language cookie.
 */
export function LocaleRouteSync() {
  const { locale } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const blogSlugs = useBlogTranslationSlugs();
  const serviceSlugs = useServiceLandingSlugs();
  const prevLocale = useRef<Locale | null>(null);

  useEffect(() => {
    if (prevLocale.current === null) {
      prevLocale.current = locale;
      return;
    }
    if (prevLocale.current === locale) return;

    prevLocale.current = locale;

    const postMatch = pathname?.match(/^\/blog\/([^/]+)\/?$/);
    if (postMatch) {
      const currentSlug = normalizeBlogSlugForLookup(postMatch[1]);
      const targetSlug = blogSlugs?.[locale];
      if (targetSlug && normalizeBlogSlugForLookup(targetSlug) !== currentSlug) {
        router.push(blogPostPath(targetSlug));
        return;
      }
    }

    const serviceMatch = pathname?.match(/^\/services\/([^/]+)\/?$/);
    if (serviceMatch) {
      const currentSlug = normalizeServiceLandingSlugParam(serviceMatch[1]);
      const targetSlug = serviceSlugs?.[locale];
      if (targetSlug && normalizeServiceLandingSlugParam(targetSlug) !== currentSlug) {
        router.push(serviceLandingPath(targetSlug));
        return;
      }
    }

    router.refresh();
  }, [locale, pathname, router, blogSlugs, serviceSlugs]);

  return null;
}
