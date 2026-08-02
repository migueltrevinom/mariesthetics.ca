import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${siteUrl}/services`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/services#facials`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/services#lashes`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/services#permanentMakeUp`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/book`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
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
  } catch (err) {
    // fallback gracefully if db not ready during build
  }

  return routes;
}
