import type { BlogListItem, PublicBlogPost, BlogServiceRef } from "@/lib/blog/types";

function mapServices(raw: unknown): BlogServiceRef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      if (!s || typeof s !== "object") return null;
      const doc = s as Record<string, unknown>;
      const id = doc._id != null ? String(doc._id) : "";
      if (!id) return null;
      return {
        _id: id,
        name: String(doc.name ?? "Service"),
        slug: doc.slug ? String(doc.slug) : undefined,
        priceCents: doc.priceCents != null ? Number(doc.priceCents) : undefined,
      };
    })
    .filter(Boolean) as BlogServiceRef[];
}

function promoFromDoc(raw: unknown): PublicBlogPost["promoConfig"] {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    enabled: Boolean(p.enabled),
    promoCode: p.promoCode ? String(p.promoCode) : "",
    customPromoText: p.customPromoText ? String(p.customPromoText) : "",
    ctaButtonText: p.ctaButtonText ? String(p.ctaButtonText) : "Book Treatment Now →",
    ctaUrl: p.ctaUrl ? String(p.ctaUrl) : "/book",
  };
}

export function serializeBlogListItem(doc: Record<string, unknown>): BlogListItem {
  return {
    _id: String(doc._id),
    translationGroupId: String(doc.translationGroupId ?? doc._id),
    title: String(doc.title ?? ""),
    slug: String(doc.slug ?? ""),
    excerpt: String(doc.excerpt ?? ""),
    coverImage: String(doc.coverImage ?? ""),
    language: (doc.language as BlogListItem["language"]) || "en",
    category: String(doc.category ?? ""),
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt as string | Date).toISOString() : null,
  };
}

export function serializeBlogPost(doc: Record<string, unknown>): PublicBlogPost {
  const list = serializeBlogListItem(doc);
  return {
    ...list,
    content: String(doc.content ?? ""),
    metaTitle: String(doc.metaTitle ?? ""),
    metaDescription: String(doc.metaDescription ?? ""),
    author: String(doc.author ?? "Marinelle Tala"),
    promoConfig: promoFromDoc(doc.promoConfig),
    serviceIds: mapServices(doc.serviceIds),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt as string | Date).toISOString() : null,
    translations: [],
  };
}
