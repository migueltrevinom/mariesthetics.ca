import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { connectDb } from "@/lib/db/connect";
import { BlogPost, Service } from "@/lib/db/models";
import { KEEP_LASHES_PRETTY_SLUG } from "@/lib/blog/posts/keepLashesPrettyEdmonton";

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
  ];

  try {
    await connectDb();
    const activeServices = await Service.find({ active: true }).select("slug updatedAt").lean();
    activeServices.forEach((svc) => {
      if (svc.slug) {
        routes.push({
          url: `${siteUrl}/services/${svc.slug}`,
          lastModified: svc.updatedAt ? new Date(svc.updatedAt) : now,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    });

    const publishedPosts = await BlogPost.find({ status: "published" })
      .select("slug updatedAt publishedAt")
      .lean();
    publishedPosts.forEach((post) => {
      if (post.slug) {
        routes.push({
          url: `${siteUrl}/blog/${post.slug}`,
          lastModified: post.updatedAt
            ? new Date(post.updatedAt)
            : post.publishedAt
              ? new Date(post.publishedAt)
              : now,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    });
  } catch (err) {
    // fallback gracefully if db not ready during build
  }

  if (!routes.some((route) => route.url.endsWith(`/blog/${KEEP_LASHES_PRETTY_SLUG}`))) {
    routes.push({
      url: `${siteUrl}/blog/${KEEP_LASHES_PRETTY_SLUG}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return routes;
}
