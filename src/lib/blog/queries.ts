import { cache } from "react";
import { connectDb } from "@/lib/db/connect";
import { BlogPost } from "@/lib/db/models";
import type { Locale } from "@/components/i18n/LanguageContext";
import { authorNamesForDbLookup } from "@/lib/blog/authors";
import { serializeBlogListItem, serializeBlogPost } from "@/lib/blog/serialize";
import type { BlogListItem, BlogTranslationRef, PublicBlogPost } from "@/lib/blog/types";
import { pickLocalizedPostsForListing } from "@/lib/blog/translations";
import { normalizeBlogSlugForLookup } from "@/lib/blog/slug";
import {
  BLOG_DEV_PREVIEW_ENABLED,
  getPreviewListItems,
  getPreviewPostBySlug,
  getPreviewTranslationsForPost,
} from "@/lib/blog/previewPosts";
import {
  PREVIEW_MOCK_COUPON,
  resolveBlogPromo,
  resolveBlogPromoPreview,
} from "@/lib/blog/resolvePromo";

const PUBLISHED_SORT = { publishedAt: -1 as const, createdAt: -1 as const };

const LIST_SELECT =
  "title slug excerpt coverImage language category publishedAt translationGroupId";

/** Loads published translations only for a specific translation group instead of scanning the full collection. */
async function loadPublishedTranslationsForGroup(
  translationGroupId: string
): Promise<BlogTranslationRef[]> {
  await connectDb();
  const rows = await BlogPost.find({
    status: "published",
    $or: [{ translationGroupId }, { _id: translationGroupId }],
  })
    .select("language slug title")
    .lean();

  return rows.map((row) => ({
    language: (row.language as BlogTranslationRef["language"]) || "en",
    slug: String(row.slug),
    title: String(row.title ?? ""),
  }));
}

export async function getPublishedBlogPosts(
  locale: Locale,
  options: { limit?: number; page?: number } = {}
): Promise<{ posts: BlogListItem[]; total: number }> {
  const limit = Math.min(100, Math.max(1, options.limit ?? 12));
  const page = Math.max(1, options.page ?? 1);
  const skip = (page - 1) * limit;

  if (BLOG_DEV_PREVIEW_ENABLED) {
    const preview = getPreviewListItems();
    const localized = pickLocalizedPostsForListing(
      preview.map((p) => ({ ...p, translationGroupId: p.translationGroupId })),
      locale
    );
    return {
      posts: localized.slice(skip, skip + limit),
      total: localized.length,
    };
  }

  try {
    await connectDb();
    const published = await BlogPost.find({ status: "published" })
      .select(LIST_SELECT)
      .lean();

    const localized = pickLocalizedPostsForListing(
      published.map((p) =>
        serializeBlogListItem(p as Record<string, unknown>)
      ),
      locale
    );

    const total = localized.length;
    const posts = localized.slice(skip, skip + limit);

    return { posts, total };
  } catch {
    return { posts: [], total: 0 };
  }
}

export async function getLatestPublishedPosts(
  locale: Locale,
  limit = 3
): Promise<BlogListItem[]> {
  const { posts } = await getPublishedBlogPosts(locale, { limit, page: 1 });
  return posts;
}

export async function getPublishedBlogSlugs(): Promise<string[]> {
  if (BLOG_DEV_PREVIEW_ENABLED) {
    return getPreviewListItems().map((p) => p.slug);
  }
  try {
    await connectDb();
    const rows = await BlogPost.find({ status: "published" }).select("slug").lean();
    return rows.map((r) => String(r.slug)).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Fetches a published blog post by slug.
 * Wrapped in React cache() to deduplicate DB queries between generateMetadata and Page components.
 */
export const getPublishedBlogPostBySlug = cache(
  async (slug: string): Promise<PublicBlogPost | null> => {
    const normalized = normalizeBlogSlugForLookup(slug);
    if (!normalized) return null;

    if (BLOG_DEV_PREVIEW_ENABLED) {
      const post = getPreviewPostBySlug(normalized);
      if (!post) return null;
      const resolvedPromo = resolveBlogPromoPreview({
        promoConfig: post.promoConfig,
        serviceIds: post.serviceIds,
        language: post.language,
        mockCoupon: post.slug.includes("aftercare") ? PREVIEW_MOCK_COUPON : null,
      });
      return {
        ...post,
        translations: getPreviewTranslationsForPost(post.translationGroupId),
        resolvedPromo,
      };
    }

    try {
      await connectDb();

      const populate = { path: "serviceIds", select: "name slug priceCents category" };

      const doc = await BlogPost.findOne({
        slug: normalized,
        status: "published",
      })
        .populate(populate)
        .lean();

      if (!doc) return null;

      const post = serializeBlogPost(doc as Record<string, unknown>);
      const groupTranslations = await loadPublishedTranslationsForGroup(post.translationGroupId);
      const translations = groupTranslations.length
        ? groupTranslations
        : [{ language: post.language, slug: post.slug, title: post.title }];
      const withTranslations = { ...post, translations };
      const resolvedPromo = await resolveBlogPromo({
        promoConfig: withTranslations.promoConfig,
        serviceIds: withTranslations.serviceIds,
        language: withTranslations.language,
      });
      return { ...withTranslations, resolvedPromo };
    } catch {
      return null;
    }
  }
);

export type PublishedBlogDiscoveryRow = {
  slug: string;
  language: string;
  translationGroupId: string;
  title: string;
  excerpt: string;
  shortAnswer?: string;
  category?: string;
  coverImage?: string;
  serviceIds?: string[];
  publishedAt?: Date | null;
  updatedAt?: Date | null;
};

/** Published posts for sitemap, llms.txt, and other discovery surfaces. */
export async function getPublishedPostsForDiscovery(): Promise<PublishedBlogDiscoveryRow[]> {
  if (BLOG_DEV_PREVIEW_ENABLED) {
    return getPreviewListItems().map((p) => ({
      slug: p.slug,
      language: p.language,
      translationGroupId: p.translationGroupId,
      title: p.title,
      excerpt: p.excerpt,
      publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      updatedAt: null,
    }));
  }
  await connectDb();
  const rows = await BlogPost.find({ status: "published" })
    .select("slug language title excerpt shortAnswer category coverImage serviceIds translationGroupId publishedAt updatedAt")
    .sort({ publishedAt: -1 })
    .lean();

  return rows.map((r) => ({
    slug: String(r.slug),
    language: String(r.language || "en"),
    translationGroupId: String(r.translationGroupId || r._id),
    title: String(r.title ?? ""),
    excerpt: String(r.excerpt ?? ""),
    shortAnswer: String(r.shortAnswer ?? ""),
    category: String(r.category ?? ""),
    coverImage: String(r.coverImage ?? ""),
    serviceIds: Array.isArray(r.serviceIds) ? r.serviceIds.map(String) : [],
    publishedAt: r.publishedAt ?? null,
    updatedAt: r.updatedAt ?? null,
  }));
}

export async function getPublishedPostsForSitemap(): Promise<
  Array<{
    slug: string;
    language: string;
    translationGroupId: string;
    coverImage?: string;
    publishedAt?: Date | null;
    updatedAt?: Date | null;
  }>
> {
  try {
    const rows = await getPublishedPostsForDiscovery();
    return rows.map(({ slug, language, translationGroupId, coverImage, publishedAt, updatedAt }) => ({
      slug,
      language,
      translationGroupId,
      coverImage,
      publishedAt,
      updatedAt,
    }));
  } catch {
    return [];
  }
}

export async function incrementBlogPostViews(slug: string): Promise<void> {
  try {
    await connectDb();
    await BlogPost.updateOne(
      { slug: normalizeBlogSlugForLookup(slug), status: "published" },
      { $inc: { viewsCount: 1 } },
      // A page view is not a content change: keep updatedAt (sitemap lastmod / dateModified) real.
      { timestamps: false }
    );
  } catch {
    // non-blocking
  }
}

/** Related posts in the same language: shared service first, then same category. Excludes the post's own translation group. */
export async function getRelatedPosts(
  post: { translationGroupId: string; language: string; category?: string; serviceIds: Array<{ _id: string }> },
  limit = 4
): Promise<BlogListItem[]> {
  if (BLOG_DEV_PREVIEW_ENABLED) return [];
  try {
    await connectDb();
    const serviceIds = post.serviceIds.map((s) => s._id);
    const or: Record<string, unknown>[] = [];
    if (serviceIds.length) or.push({ serviceIds: { $in: serviceIds } });
    if (post.category) or.push({ category: post.category });
    if (!or.length) return [];
    const rows = await BlogPost.find({
      status: "published",
      language: post.language,
      translationGroupId: { $ne: post.translationGroupId },
      $or: or,
    })
      .select(`${LIST_SELECT} serviceIds`)
      .sort(PUBLISHED_SORT)
      .limit(40)
      .lean();
    const sid = new Set(serviceIds.map(String));
    const shares = (r: Record<string, unknown>) =>
      Array.isArray(r.serviceIds) && (r.serviceIds as unknown[]).some((x) => sid.has(String(x)));
    const sorted = [...rows].sort((a, b) => Number(shares(b)) - Number(shares(a)));
    return sorted.slice(0, limit).map((r) => serializeBlogListItem(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

/** Published posts by an author in a language (author page). */
export async function getPostsByAuthor(author: string, language: string, limit = 12): Promise<BlogListItem[]> {
  try {
    await connectDb();
    const rows = await BlogPost.find({ status: "published", author: { $in: authorNamesForDbLookup(author) }, language })
      .select(LIST_SELECT)
      .sort(PUBLISHED_SORT)
      .limit(limit)
      .lean();
    return rows.map((r) => serializeBlogListItem(r as Record<string, unknown>));
  } catch {
    return [];
  }
}
