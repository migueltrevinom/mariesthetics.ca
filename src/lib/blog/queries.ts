import { connectDb } from "@/lib/db/connect";
import { BlogPost } from "@/lib/db/models";
import type { Locale } from "@/components/i18n/LanguageContext";
import { serializeBlogListItem, serializeBlogPost } from "@/lib/blog/serialize";
import type { BlogListItem, BlogTranslationRef, PublicBlogPost } from "@/lib/blog/types";
import { pickLocalizedPostsForListing } from "@/lib/blog/translations";
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

async function loadPublishedTranslationMap(): Promise<Map<string, BlogTranslationRef[]>> {
  await connectDb();
  const rows = await BlogPost.find({ status: "published" })
    .select("translationGroupId language slug title")
    .lean();

  const map = new Map<string, BlogTranslationRef[]>();
  for (const row of rows) {
    const gid = String(row.translationGroupId || row._id);
    const entry: BlogTranslationRef = {
      language: (row.language as BlogTranslationRef["language"]) || "en",
      slug: String(row.slug),
      title: String(row.title ?? ""),
    };
    if (!map.has(gid)) map.set(gid, []);
    map.get(gid)!.push(entry);
  }
  return map;
}

function attachTranslations(
  post: PublicBlogPost,
  map: Map<string, BlogTranslationRef[]>
): PublicBlogPost {
  const translations = map.get(post.translationGroupId) || [
    { language: post.language, slug: post.slug, title: post.title },
  ];
  return { ...post, translations };
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

export async function getPublishedBlogPostBySlug(slug: string): Promise<PublicBlogPost | null> {
  const normalized = slug.toLowerCase().trim();
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

    const populate = { path: "serviceIds", select: "name slug priceCents" };

    const doc = await BlogPost.findOne({
      slug: normalized,
      status: "published",
    })
      .populate(populate)
      .lean();

    if (!doc) return null;

    const map = await loadPublishedTranslationMap();
    const post = serializeBlogPost(doc as Record<string, unknown>);
    const withTranslations = attachTranslations(post, map);
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

export async function getPublishedPostsForSitemap(): Promise<
  Array<{
    slug: string;
    language: string;
    translationGroupId: string;
    publishedAt?: Date | null;
    updatedAt?: Date | null;
  }>
> {
  if (BLOG_DEV_PREVIEW_ENABLED) {
    return getPreviewListItems().map((p) => ({
      slug: p.slug,
      language: p.language,
      translationGroupId: p.translationGroupId,
      publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      updatedAt: null,
    }));
  }
  try {
    await connectDb();
    return await BlogPost.find({ status: "published" })
      .select("slug language translationGroupId publishedAt updatedAt")
      .lean();
  } catch {
    return [];
  }
}

export async function incrementBlogPostViews(slug: string): Promise<void> {
  try {
    await connectDb();
    await BlogPost.updateOne(
      { slug: slug.toLowerCase(), status: "published" },
      { $inc: { viewsCount: 1 } }
    );
  } catch {
    // non-blocking
  }
}
