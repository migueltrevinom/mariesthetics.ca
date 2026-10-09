import type { Locale } from "@/components/i18n/LanguageContext";
import type { BlogLanguage } from "@/lib/blog/types";
import { siteUrl } from "@/lib/seo";

export const BLOG_LANGUAGES: BlogLanguage[] = ["en", "es", "tl", "pa", "ar"];

export function localeToHreflang(locale: Locale | BlogLanguage): string {
  switch (locale) {
    case "en":
      return "en-CA";
    case "es":
      return "es";
    case "tl":
      return "tl";
    case "pa":
      return "pa";
    case "ar":
      return "ar";
    default:
      return "en-CA";
  }
}

export type BlogTranslationLink = {
  language: BlogLanguage;
  slug: string;
  title?: string;
};

export function blogPostUrl(slug: string): string {
  return `${siteUrl}/blog/${slug}`;
}

/** Build Next.js / sitemap `alternates.languages` map including x-default (English). */
export function buildBlogHreflangAlternates(
  translations: BlogTranslationLink[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const t of translations) {
    if (!t.slug) continue;
    map[localeToHreflang(t.language)] = blogPostUrl(t.slug);
  }
  const en = translations.find((t) => t.language === "en" && t.slug);
  if (en) {
    map["x-default"] = blogPostUrl(en.slug);
  } else if (translations[0]?.slug) {
    map["x-default"] = blogPostUrl(translations[0].slug);
  }
  return map;
}

export function blogLanguageDir(language: BlogLanguage): "ltr" | "rtl" {
  return language === "ar" ? "rtl" : "ltr";
}
