import {
  CLASSIC_FILL_ID,
  CLASSIC_SET_ID,
  HYBRID_FILL_ID,
  HYBRID_SET_ID,
  VOLUME_FILL_ID,
  VOLUME_SET_ID,
  keepLashesPrettyEdmontonPost,
} from "@/lib/blog/posts/keepLashesPrettyEdmonton";

export const FEATURED_LASH_SERVICES = [
  { _id: CLASSIC_FILL_ID, name: "Classic Fill", priceCents: 4500, durationMin: 90 },
  { _id: HYBRID_FILL_ID, name: "Hybrid Fill", priceCents: 4500, durationMin: 60 },
  { _id: VOLUME_FILL_ID, name: "Volume Fill", priceCents: 5500, durationMin: 90 },
  { _id: CLASSIC_SET_ID, name: "Classic Set", priceCents: 7000, durationMin: 120 },
  { _id: HYBRID_SET_ID, name: "Hybrid Set", priceCents: 9000, durationMin: 135 },
  { _id: VOLUME_SET_ID, name: "Volume Set (2D-5D)", priceCents: 10000, durationMin: 150 },
];

export function featuredEdmontonLashPost() {
  const post = keepLashesPrettyEdmontonPost;
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    language: post.language,
    category: post.category,
    status: post.status,
    author: post.author,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    keywords: post.keywords,
    publishedAt: new Date("2026-09-04T12:00:00.000Z"),
    updatedAt: new Date("2026-09-04T12:00:00.000Z"),
    serviceIds: post.serviceIds.map((id) => String(id)),
    promoConfig: post.promoConfig,
  };
}
