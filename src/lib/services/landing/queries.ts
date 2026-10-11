import { connectDb } from "@/lib/db/connect";
import { BlogPost, Service, ServiceImage } from "@/lib/db/models";
import type { LandingDefinition, LandingMatch } from "./types";
import { blogPostPath } from "@/lib/blog/slug";
import { previewServicesForLanding, SERVICE_LANDING_DEV_PREVIEW } from "./previewServices";

export type LandingServiceRow = {
  _id: string;
  name: string;
  description: string;
  slug: string;
  durationMin: number;
  priceCents: number;
  depositCents: number;
  category: string;
  photos: string[];
  nameTranslations?: Record<string, string>;
  descriptionTranslations?: Record<string, string>;
};

export type RelatedBlogPost = {
  title: string;
  slug: string;
  excerpt: string;
};

function matchesService(row: LandingServiceRow, match: LandingMatch): boolean {
  if (match.type === "category") {
    return row.category === match.category;
  }
  return match.slugs.includes(row.slug);
}

export async function loadServicesForLanding(
  definition: LandingDefinition
): Promise<LandingServiceRow[]> {
  const isPreview = SERVICE_LANDING_DEV_PREVIEW || process.env.SERVICE_LANDING_DEV_PREVIEW === "1";
  try {
    await connectDb();
  } catch {
    if (isPreview) return previewServicesForLanding(definition);
    return [];
  }

  // Performance optimization: Filter active services at the MongoDB query level using match definition
  // instead of fetching all active services across the entire database into Node memory.
  const query =
    definition.match.type === "category"
      ? { active: true, category: definition.match.category }
      : { active: true, slug: { $in: definition.match.slugs } };

  const matchedServices = await Service.find(query).sort({ sortOrder: 1 }).lean();

  if (!matchedServices.length) {
    if (isPreview) {
      return previewServicesForLanding(definition);
    }
    return [];
  }

  // Performance optimization: Only query ServiceImage for matched services that do not have photos populated.
  const serviceIdsNeedingImages = matchedServices
    .filter((s) => !Array.isArray(s.photos) || s.photos.length === 0)
    .map((s) => String(s._id));

  const imageMap = new Map<string, string[]>();
  if (serviceIdsNeedingImages.length > 0) {
    try {
      const images = await ServiceImage.find({
        isPrivate: false,
        serviceId: { $in: serviceIdsNeedingImages },
      }).lean();
      for (const img of images as Array<{ serviceId: unknown; url?: string }>) {
        const id = String(img.serviceId);
        if (!imageMap.has(id)) imageMap.set(id, []);
        if (img.url) imageMap.get(id)!.push(img.url);
      }
    } catch {
      // optional
    }
  }

  const rows: LandingServiceRow[] = matchedServices.map((s) => {
    const slug = String(s.slug || "");
    const id = String(s._id);
    return {
      _id: id,
      name: String(s.name),
      description: String(s.description ?? ""),
      slug,
      durationMin: Number(s.durationMin),
      priceCents: Number(s.priceCents),
      depositCents: Number(s.depositCents),
      category: String(s.category ?? "general"),
      photos:
        Array.isArray(s.photos) && s.photos.length > 0
          ? s.photos.map(String)
          : imageMap.get(id) || [],
      nameTranslations: s.nameTranslations as Record<string, string> | undefined,
      descriptionTranslations: s.descriptionTranslations as Record<string, string> | undefined,
    };
  });

  return rows;
}

export async function loadRelatedBlogPosts(
  serviceIds: string[],
  limit = 3
): Promise<RelatedBlogPost[]> {
  if (!serviceIds.length) return [];
  try {
    await connectDb();
  } catch {
    return [];
  }
  const posts = await BlogPost.find({
    status: "published",
    serviceIds: { $in: serviceIds },
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select("title slug excerpt")
    .lean();

  return posts.map((p) => ({
    title: String(p.title),
    slug: String(p.slug),
    excerpt: String(p.excerpt ?? ""),
  }));
}

export function primaryLandingImage(
  services: LandingServiceRow[],
  heroServiceSlug: string
): string | undefined {
  const hero = services.find((s) => s.slug === heroServiceSlug) || services[0];
  const photo = hero?.photos?.[0];
  if (!photo) return `/images/services/${heroServiceSlug}.jpg`;
  return photo;
}

export function relatedBlogPath(slug: string): string {
  return blogPostPath(slug);
}
