import type { MetadataRoute } from "next";
import { buildBlogHreflangAlternates, blogPostUrl } from "@/lib/blog/locales";
import { getPublishedPostsForSitemap } from "@/lib/blog/queries";
import { SERVICE_LANDING_PAGES } from "@/lib/services/landing/registry";
import { hreflangAlternatesForLanding } from "@/lib/services/landing/resolve";
import { serviceLandingPath } from "@/lib/services/landing/paths";
import { siteUrl } from "@/lib/seo";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${siteUrl}/services`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/book`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/gift-cards`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/locations/west-edmonton`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/llms.txt`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/llms-full.txt`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
  ];

  for (const def of SERVICE_LANDING_PAGES) {
    const languages = hreflangAlternatesForLanding(def);
    routes.push({
      url: `${siteUrl}${serviceLandingPath(def.slugs.en)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
      alternates: Object.keys(languages).length > 0 ? { languages } : undefined,
    });
  }

  const publishedPosts = await getPublishedPostsForSitemap();
  const translationsByGroup = new Map<
    string,
    Array<{ language: string; slug: string }>
  >();

  for (const post of publishedPosts) {
    const gid = String(post.translationGroupId || post.slug);
    if (!translationsByGroup.has(gid)) translationsByGroup.set(gid, []);
    translationsByGroup.get(gid)!.push({
      language: String(post.language),
      slug: String(post.slug),
    });
  }

  for (const post of publishedPosts) {
    if (!post.slug) continue;
    const gid = String(post.translationGroupId || post.slug);
    const siblings = translationsByGroup.get(gid) || [];
    const languages = buildBlogHreflangAlternates(
      siblings.map((s) => ({
        language: s.language as "en" | "es" | "tl" | "pa" | "ar",
        slug: s.slug,
      }))
    );

    routes.push({
      url: blogPostUrl(post.slug),
      lastModified: post.publishedAt
        ? new Date(post.publishedAt)
        : post.updatedAt
          ? new Date(post.updatedAt)
          : now,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: Object.keys(languages).length > 0 ? { languages } : undefined,
    });
  }

  return routes;
}
