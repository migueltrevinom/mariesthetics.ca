import { connectDb } from "@/lib/db/connect";
import { BlogPost, type BlogPostDoc } from "@/lib/db/models";
import { normalizeBlogSlugForLookup } from "@/lib/blog/slug";

export interface BlogFilterOptions {
  language?: string;
  serviceId?: string;
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export class BlogRepository {
  static async create(data: any): Promise<BlogPostDoc> {
    await connectDb();
    const post = await BlogPost.create(data);
    return post;
  }

  static async update(id: string, data: any): Promise<BlogPostDoc | null> {
    await connectDb();
    const post = await BlogPost.findByIdAndUpdate(id, { $set: data }, { new: true });
    return post;
  }

  static async delete(id: string): Promise<BlogPostDoc | null> {
    await connectDb();
    const post = await BlogPost.findByIdAndDelete(id);
    return post;
  }

  static async findById(id: string): Promise<BlogPostDoc | null> {
    await connectDb();
    const post = await BlogPost.findById(id).populate("serviceIds").lean();
    return post as BlogPostDoc | null;
  }

  static async findBySlug(slug: string): Promise<BlogPostDoc | null> {
    await connectDb();
    const post = await BlogPost.findOne({ slug: normalizeBlogSlugForLookup(slug) })
      .populate("serviceIds")
      .lean();
    return post as BlogPostDoc | null;
  }

  static async findByTranslationGroupId(
    translationGroupId: string,
    options?: { status?: string }
  ): Promise<BlogPostDoc[]> {
    await connectDb();
    const query: Record<string, unknown> = { translationGroupId };
    if (options?.status && options.status !== "all") {
      query.status = options.status;
    }
    const posts = await BlogPost.find(query)
      .sort({ language: 1 })
      .populate("serviceIds", "name slug priceCents")
      .lean();
    return posts as BlogPostDoc[];
  }

  static async findAll(options: BlogFilterOptions = {}): Promise<{
    posts: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await connectDb();

    const query: any = {};

    if (options.language && options.language !== "all") {
      query.language = options.language;
    }

    if (options.status && options.status !== "all") {
      query.status = options.status;
    }

    if (options.serviceId && options.serviceId !== "all") {
      query.serviceIds = options.serviceId;
    }

    if (options.category && options.category !== "all") {
      query.category = options.category;
    }

    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { slug: searchRegex },
        { excerpt: searchRegex },
      ];
    }

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 50));
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("serviceIds", "name slug priceCents")
        .lean(),
      BlogPost.countDocuments(query),
    ]);

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async incrementViews(idOrSlug: string): Promise<void> {
    await connectDb();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const query = isObjectId
      ? { _id: idOrSlug }
      : { slug: normalizeBlogSlugForLookup(idOrSlug) };
    await BlogPost.updateOne(query, { $inc: { viewsCount: 1 } });
  }

  static async getStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
  }> {
    await connectDb();
    const [totalPosts, publishedPosts, draftPosts, viewsAgg] = await Promise.all([
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ status: "published" }),
      BlogPost.countDocuments({ status: "draft" }),
      BlogPost.aggregate([{ $group: { _id: null, totalViews: { $sum: "$viewsCount" } } }]),
    ]);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews: viewsAgg[0]?.totalViews || 0,
    };
  }
}
