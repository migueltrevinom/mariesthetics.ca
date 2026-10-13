import { headers } from "next/headers";
import type { Locale } from "@/components/i18n/LanguageContext";
import { localeToHreflang } from "@/lib/blog/locales";
import { getServerLocale, parseLocale } from "@/lib/i18n/locale";
import { resolveLandingBySlugParam } from "@/lib/services/landing/resolve";
import { normalizeBlogSlugForLookup } from "@/lib/blog/slug";
import { connectDb } from "@/lib/db/connect";
import { BlogPost } from "@/lib/db/models";

/**
 * Content language of the current page: localized URLs (/services/<slug>, /blog/<slug>)
 * carry their own language; every other page renders in the visitor's NEXT_LOCALE.
 */
export async function getPageContentLocale(): Promise<Locale> {
  const pathname = (await headers()).get("x-pathname") || "";
  const service = pathname.match(/^\/services\/([^/]+)\/?$/);
  if (service) {
    const resolved = resolveLandingBySlugParam(service[1]);
    if (resolved) return resolved.locale;
  }
  const blog = pathname.match(/^\/blog\/([^/]+)\/?$/);
  if (blog) {
    const slug = normalizeBlogSlugForLookup(blog[1]);
    if (slug) {
      try {
        await connectDb();
        const post = await BlogPost.findOne({ slug, status: "published" }).select("language").lean<{ language?: string }>();
        if (post?.language) return parseLocale(post.language);
      } catch {
        // fall through to the visitor locale
      }
    }
  }
  return getServerLocale();
}

export function htmlAttrsForLocale(locale: Locale): { lang: string; dir: "ltr" | "rtl" } {
  return { lang: localeToHreflang(locale), dir: locale === "ar" ? "rtl" : "ltr" };
}
