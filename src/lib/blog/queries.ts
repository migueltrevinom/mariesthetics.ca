import { connectDb } from "@/lib/db/connect";
import { BlogPost } from "@/lib/db/models";
import type { Locale } from "@/components/i18n/LanguageContext";
import { serializeBlogListItem, serializeBlogPost } from "@/lib/blog/serialize";
import type { BlogListItem, PublicBlogPost } from "@/lib/blog/types";
import {
  BLOG_DEV_PREVIEW_ENABLED,
  getPreviewListItems,
  getPreviewPostBySlug,
} from "@/lib/blog/previewPosts";

const PUBLISHED_SORT = { publishedAt: -1 as const, createdAt: -1 as const };

export async function getPublishedBlogPosts(
  locale: Locale,
  options: { limit?: number; page?: number } = {}
): Promise<{ posts: BlogListItem[]; total: number }> {
  const limit = Math.min(100, Math.max(1, options.limit ?? 12));
  const page = Math.max(1, options.page ?? 1);
  const skip = (page - 1) * limit;

  if (BLOG_DEV_PREVIEW_ENABLED) {
    const preview = getPreviewListItems();
    return { posts: preview.slice(0, limit), total: preview.length };
  }

  try {
    await connectDb();

    const baseQuery = { status: "published" as const };

    let posts = await BlogPost.find({ ...baseQuery, language: locale })
      .sort(PUBLISHED_SORT)
      .skip(skip)
      .limit(limit)
      .select("title slug excerpt coverImage language category publishedAt")
      .lean();

    let total = await BlogPost.countDocuments({ ...baseQuery, language: locale });

    if (locale !== "en" && posts.length === 0 && page === 1) {
      posts = await BlogPost.find({ ...baseQuery, language: "en" })
        .sort(PUBLISHED_SORT)
        .skip(skip)
        .limit(limit)
        .select("title slug excerpt coverImage language category publishedAt")
        .lean();
      total = await BlogPost.countDocuments({ ...baseQuery, language: "en" });
    }

    return {
      posts: posts.map((p) => serializeBlogListItem(p as Record<string, unknown>)),
      total,
    };
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
  try {
    await connectDb();
    const rows = await BlogPost.find({ status: "published" }).select("slug").lean();
    return rows.map((r) => String(r.slug)).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getPublishedBlogPostBySlug(
  slug: string,
  locale: Locale
): Promise<PublicBlogPost | null> {
  const normalized = slug.toLowerCase().trim();
  if (!normalized) return null;

  if (BLOG_DEV_PREVIEW_ENABLED) {
    return getPreviewPostBySlug(normalized);
  }

  try {
    await connectDb();

    const populate = { path: "serviceIds", select: "name slug priceCents" };

    let doc = await BlogPost.findOne({
      slug: normalized,
      status: "published",
      language: locale,
    })
      .populate(populate)
      .lean();

    if (!doc && locale !== "en") {
      doc = await BlogPost.findOne({
        slug: normalized,
        status: "published",
        language: "en",
      })
        .populate(populate)
        .lean();
    }

    if (!doc) {
      doc = await BlogPost.findOne({
        slug: normalized,
        status: "published",
      })
        .populate(populate)
        .lean();
    }

    if (!doc) return null;

    return serializeBlogPost(doc as Record<string, unknown>);
  } catch {
    return null;
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
