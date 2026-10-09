export type BlogLanguage = "en" | "es" | "tl" | "pa" | "ar";

export type BlogPromoConfig = {
  enabled: boolean;
  promoCode?: string;
  customPromoText?: string;
  ctaButtonText?: string;
  ctaUrl?: string;
};

export type BlogServiceRef = {
  _id: string;
  name: string;
  slug?: string;
  priceCents?: number;
};

export type PublicBlogPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  language: BlogLanguage;
  category: string;
  publishedAt: string | null;
  metaTitle: string;
  metaDescription: string;
  author: string;
  promoConfig: BlogPromoConfig;
  serviceIds: BlogServiceRef[];
};

export type BlogListItem = Pick<
  PublicBlogPost,
  | "_id"
  | "title"
  | "slug"
  | "excerpt"
  | "coverImage"
  | "language"
  | "category"
  | "publishedAt"
>;
