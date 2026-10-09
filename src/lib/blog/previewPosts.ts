import type { BlogListItem, PublicBlogPost } from "@/lib/blog/types";

/** In-memory sample posts — only served when BLOG_DEV_PREVIEW=1 (never in production). */
export const BLOG_DEV_PREVIEW_ENABLED = process.env.BLOG_DEV_PREVIEW === "1";

const PREVIEW: PublicBlogPost[] = [
  {
    _id: "preview-1",
    title: "How to Care for Your Skin After a Dermaplaning Facial",
    slug: "aftercare-dermaplaning-facial",
    excerpt:
      "Gentle aftercare keeps your glow lasting longer after dermaplaning. Here is what Mari recommends for the first 48 hours.",
    content: `## Why aftercare matters

Dermaplaning removes dead skin and peach fuzz for an instantly smoother canvas. The trade-off is that your skin is more receptive — and more sensitive — for a short window afterward.

## The first 24 hours

Skip heavy makeup, retinoids, and harsh exfoliants. Use a gentle cleanser, hydrate generously, and apply SPF 30+ if you step outside.`,
    coverImage: "/images/services/hydra-facial.jpg",
    language: "en",
    category: "Skin Care Tips",
    publishedAt: new Date().toISOString(),
    metaTitle: "Dermaplaning Aftercare Tips",
    metaDescription: "Post-dermaplaning skin care advice from Mari Esthetics in West Edmonton.",
    author: "Marinelle Tala",
    promoConfig: {
      enabled: true,
      promoCode: "GLOW10",
      customPromoText: "Save on your next facial when you book this month.",
      ctaButtonText: "Book Treatment Now →",
      ctaUrl: "/book",
    },
    serviceIds: [],
  },
  {
    _id: "preview-2",
    title: "Lash Lift Aftercare: Keep Your Curl for Weeks",
    slug: "lash-lift-aftercare-guide",
    excerpt:
      "A few simple habits protect your lash lift investment — from shower steam to sleep position.",
    content: `## Keep them dry at first

Avoid water, steam, and sweat on your lashes for the first 24 hours so the lift sets properly.`,
    coverImage: "/images/services/hybrid-set.jpg",
    language: "en",
    category: "Lashes",
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    metaTitle: "",
    metaDescription: "Lash lift aftercare from Mari Esthetics.",
    author: "Marinelle Tala",
    promoConfig: { enabled: false, ctaUrl: "/book", ctaButtonText: "Book Lash Lift →" },
    serviceIds: [],
  },
  {
    _id: "preview-3",
    title: "What to Expect at Your First Facial at Mari Esthetics",
    slug: "first-facial-what-to-expect",
    excerpt:
      "Nervous about your first visit? Here is how a private, one-on-one facial unfolds in our West Edmonton studio.",
    content: `## A calm, unhurried consultation

We start with your skin goals, sensitivities, and routine.`,
    coverImage: "/images/services/basic-facial.jpg",
    language: "en",
    category: "Studio",
    publishedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    metaTitle: "",
    metaDescription: "",
    author: "Marinelle Tala",
    promoConfig: { enabled: false, ctaUrl: "/book" },
    serviceIds: [],
  },
];

export function getPreviewListItems(): BlogListItem[] {
  return PREVIEW.map((p) => ({
    _id: p._id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    language: p.language,
    category: p.category,
    publishedAt: p.publishedAt,
  }));
}

export function getPreviewPostBySlug(slug: string): PublicBlogPost | null {
  return PREVIEW.find((p) => p.slug === slug.toLowerCase()) ?? null;
}
