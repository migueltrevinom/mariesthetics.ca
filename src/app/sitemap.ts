import type { MetadataRoute } from "next";
import { buildBlogHreflangAlternates, blogPostUrl } from "@/lib/blog/locales";
import { getPublishedPostsForSitemap } from "@/lib/blog/queries";
import { SERVICE_LANDING_PAGES } from "@/lib/services/landing/registry";
import { hreflangAlternatesForLanding } from "@/lib/services/landing/resolve";
import { serviceLandingPath } from "@/lib/services/landing/paths";
import { hreflangForSinglePath, siteUrl } from "@/lib/seo";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const routes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}`, changeFrequency: "weekly", priority: 1.0, alternates: { languages: hreflangForSinglePath("/") } },
    { url: `${siteUrl}/services`, changeFrequency: "daily", priority: 0.9, alternates: { languages: hreflangForSinglePath("/services") } },
    { url: `${siteUrl}/book`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/gift-cards`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/locations/west-edmonton`, changeFrequency: "weekly", priority: 0.9, alternates: { languages: hreflangForSinglePath("/locations/west-edmonton") } },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.8, alternates: { languages: hreflangForSinglePath("/blog") } },
    { url: `${siteUrl}/llms.txt`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/llms-full.txt`, changeFrequency: "weekly", priority: 0.5 },
  ];

  for (const def of SERVICE_LANDING_PAGES) {
    const languages = hreflangAlternatesForLanding(def);
    // One entry per language (same URLs as llms.txt), each listing every translation.
    for (const locale of ["en", "es", "tl", "pa", "ar"] as const) {
      const segment = def.slugs[locale];
      if (!segment) continue;
      routes.push({
        url: `${siteUrl}${serviceLandingPath(segment)}`,
        changeFrequency: "weekly",
        priority: locale === "en" ? 0.85 : 0.8,
        alternates: Object.keys(languages).length > 0 ? { languages } : undefined,
      });
    }
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
      // Real document timestamps only — never the sitemap generation time.
      ...(post.updatedAt || post.publishedAt
        ? { lastModified: new Date((post.updatedAt || post.publishedAt)!) }
        : {}),
      changeFrequency: "monthly",
      priority: 0.6,
      ...(post.coverImage
        ? { images: [post.coverImage.startsWith("http") ? post.coverImage : `${siteUrl}${post.coverImage}`] }
        : {}),
      alternates: Object.keys(languages).length > 0 ? { languages } : undefined,
    });
  }

  // Blog index changes when any post changes: use the newest real post timestamp.
  const newest = publishedPosts
    .map((p) => p.updatedAt || p.publishedAt)
    .filter(Boolean)
    .map((d) => new Date(d as Date).getTime())
    .sort((a, b) => b - a)[0];
  const blogIndex = routes.find((r) => r.url === `${siteUrl}/blog`);
  if (blogIndex && newest) blogIndex.lastModified = new Date(newest);
  routes.push({ url: `${siteUrl}/about/marinelle`, changeFrequency: "monthly", priority: 0.5 });

  return routes;
}
