import { connectDb } from "@/lib/db/connect";
import { BlogPost, Service, ServiceImage } from "@/lib/db/models";
import type { LandingDefinition, LandingMatch } from "./types";
import { blogPostPath } from "@/lib/blog/slug";
import { previewServicesForLanding, SERVICE_LANDING_DEV_PREVIEW } from "./previewServices";
import { isVolumeLash } from "./volumeMatch";

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
  if (match.type === "volumeLashes") {
    return isVolumeLash(row);
  }
  return match.slugs.includes(row.slug);
}

export async function loadServicesForLanding(
  definition: LandingDefinition
): Promise<LandingServiceRow[]> {
  try {
    await connectDb();
  } catch {
    if (SERVICE_LANDING_DEV_PREVIEW) return previewServicesForLanding(definition);
    return [];
  }

  // ⚡ Bolt Optimization: Filter services at the database query level using definition.match
  // rather than fetching all active services into memory and filtering in JavaScript.
  const query: Record<string, unknown> = { active: true };
  if (definition.match.type === "category") {
    query.category = definition.match.category;
  } else if (definition.match.type === "slugs") {
    query.slug = { $in: definition.match.slugs };
  }

  const matchedServices = await Service.find(query).sort({ sortOrder: 1 }).lean();

  if (!matchedServices.length && SERVICE_LANDING_DEV_PREVIEW) {
    return previewServicesForLanding(definition);
  }

  const matchedIds = matchedServices.map((s) => s._id);

  const imageMap = new Map<string, string[]>();
  if (matchedIds.length > 0) {
    try {
      // ⚡ Bolt Optimization: Only query images for the matched services instead of loading all public service images
      const images = await ServiceImage.find({
        isPrivate: false,
        serviceId: { $in: matchedIds },
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

  const rows: LandingServiceRow[] = [];
  for (const s of matchedServices) {
    const slug = String(s.slug || "");
    const row: LandingServiceRow = {
      _id: String(s._id),
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
          : imageMap.get(String(s._id)) || [],
      nameTranslations: s.nameTranslations as Record<string, string> | undefined,
      descriptionTranslations: s.descriptionTranslations as Record<string, string> | undefined,
    };
    if (matchesService(row, definition.match)) {
      rows.push(row);
    }
  }
  if (!rows.length && SERVICE_LANDING_DEV_PREVIEW) {
    return previewServicesForLanding(definition);
  }
  return rows;
}

export async function loadRelatedBlogPosts(
  serviceIds: string[],
  language: string = "en",
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
    language,
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
