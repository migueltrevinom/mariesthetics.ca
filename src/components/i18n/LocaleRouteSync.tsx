"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage, type Locale } from "@/components/i18n/LanguageContext";
import { useBlogTranslationSlugs } from "@/components/blog/BlogTranslationContext";

/**
 * Keeps server-rendered blog/home content in sync with the client language cookie.
 */
export function LocaleRouteSync() {
  const { locale } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const blogSlugs = useBlogTranslationSlugs();
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
      const currentSlug = postMatch[1];
      const targetSlug = blogSlugs?.[locale];
      if (targetSlug && targetSlug !== currentSlug) {
        router.push(`/blog/${targetSlug}`);
        return;
      }
    }

    router.refresh();
  }, [locale, pathname, router, blogSlugs]);

  return null;
}
