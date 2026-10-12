import { BlogRepository, type BlogFilterOptions } from "../repositories/blog.repository";
import { BlogPost } from "@/lib/db/models";
import { nanoid } from "nanoid";

export function slugify(text: string): string {
  const raw = text.toString().normalize("NFKC").trim().toLowerCase();
  const slug = raw
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}\-]+/gu, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return slug || "post";
}

export async function generateUniqueSlug(title: string, existingId?: string): Promise<string> {
  const baseSlug = slugify(title) || "post";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query: any = { slug };
    if (existingId) {
      query._id = { $ne: existingId };
    }
    const found = await BlogPost.findOne(query);
    if (!found) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export async function createBlogPost(data: any) {
  const slug = data.slug ? slugify(data.slug) : await generateUniqueSlug(data.title);
  const translationGroupId = data.translationGroupId?.trim() || nanoid(12);
  const postData = {
    ...data,
    slug,
    translationGroupId,
    publishedAt: data.status === "published" ? data.publishedAt || new Date() : null,
  };
  return await BlogRepository.create(postData);
}

export async function createBlogTranslationSet(data: {
  translationGroupId?: string;
  status: "draft" | "published" | "archived";
  publishedAt?: string | null;
  coverImage?: string;
  category?: string;
  author?: string;
  serviceIds?: string[];
  promoConfig?: Record<string, unknown>;
  translations: Array<{
    language: string;
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
  }>;
}) {
  const translationGroupId = data.translationGroupId?.trim() || nanoid(12);
  const publishedAt =
    data.status === "published" ? data.publishedAt || new Date().toISOString() : null;

  const created = [];
  for (const entry of data.translations) {
    const slug = entry.slug
      ? slugify(entry.slug)
      : await generateUniqueSlug(entry.title);
    const post = await BlogRepository.create({
      title: entry.title,
      slug,
      excerpt: entry.excerpt ?? "",
      content: entry.content,
      coverImage: data.coverImage ?? "",
      language: entry.language,
      translationGroupId,
      serviceIds: data.serviceIds ?? [],
      category: data.category ?? "",
      status: data.status,
      publishedAt,
      metaTitle: entry.metaTitle ?? "",
      metaDescription: entry.metaDescription ?? "",
      author: data.author ?? "Marinelle Tala",
      promoConfig: data.promoConfig,
    });
    created.push(post);
  }

  return { translationGroupId, posts: created };
}

export async function updateBlogPost(id: string, data: any) {
  let updateData = { ...data };
  if (data.title && !data.slug) {
    // If title changed and slug wasn't explicitly provided, we can keep existing or re-slug
  } else if (data.slug) {
    updateData.slug = slugify(data.slug);
  }

  if (data.status === "published" && !data.publishedAt) {
    updateData.publishedAt = new Date();
  }

  return await BlogRepository.update(id, updateData);
}

export async function getBlogPosts(options: BlogFilterOptions) {
  return await BlogRepository.findAll(options);
}

export async function getBlogPostById(id: string) {
  return await BlogRepository.findById(id);
}

export async function deleteBlogPost(id: string) {
  return await BlogRepository.delete(id);
}

export async function getBlogStatistics() {
  return await BlogRepository.getStats();
}
