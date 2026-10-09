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

export type BlogTranslationRef = {
  language: BlogLanguage;
  slug: string;
  title: string;
};

export type PublicBlogPost = {
  _id: string;
  translationGroupId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  language: BlogLanguage;
  category: string;
  publishedAt: string | null;
  updatedAt?: string | null;
  metaTitle: string;
  metaDescription: string;
  author: string;
  promoConfig: BlogPromoConfig;
  serviceIds: BlogServiceRef[];
  translations: BlogTranslationRef[];
};

export type BlogListItem = Pick<
  PublicBlogPost,
  | "_id"
  | "translationGroupId"
  | "title"
  | "slug"
  | "excerpt"
  | "coverImage"
  | "language"
  | "category"
  | "publishedAt"
>;
