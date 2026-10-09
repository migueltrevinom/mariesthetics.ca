import type { BlogListItem, BlogTranslationRef, PublicBlogPost, ResolvedBlogPromo } from "@/lib/blog/types";

const PLACEHOLDER_RESOLVED: ResolvedBlogPromo = {
  enabled: false,
  hasValidCoupon: false,
  headline: "",
  ctaUrl: "/book",
  ctaButtonText: "Book Treatment Now →",
  eyebrow: "booking",
};

/** In-memory sample posts — only served when BLOG_DEV_PREVIEW=1 (never in production). */
export const BLOG_DEV_PREVIEW_ENABLED = process.env.BLOG_DEV_PREVIEW === "1";

const GROUP_A = "preview-group-dermaplaning";
const GROUP_B = "preview-group-lash";
const GROUP_C = "preview-group-facial";

const PREVIEW: PublicBlogPost[] = [
  {
    _id: "preview-en-1",
    translationGroupId: GROUP_A,
    title: "How to Care for Your Skin After a Dermaplaning Facial",
    slug: "aftercare-dermaplaning-facial",
    excerpt: "Gentle aftercare keeps your glow lasting longer after dermaplaning in West Edmonton.",
    content: "## Why aftercare matters\n\nDermaplaning leaves skin smooth and more receptive to hydration.",
    coverImage: "/images/services/hydra-facial.jpg",
    language: "en",
    category: "Skin Care Tips",
    publishedAt: new Date().toISOString(),
    metaTitle: "Dermaplaning Aftercare Tips | West Edmonton",
    metaDescription: "Post-dermaplaning skin care advice from Mari Esthetics in West Edmonton.",
    author: "Marinelle Tala",
    promoConfig: {
      enabled: true,
      couponId: "preview-mock",
      promoCode: "",
      customPromoText: "",
      ctaButtonText: "Book Treatment Now →",
      ctaUrl: "/book",
    },
    serviceIds: [],
    translations: [],
    resolvedPromo: PLACEHOLDER_RESOLVED,
  },
  {
    _id: "preview-es-1",
    translationGroupId: GROUP_A,
    title: "Cómo cuidar tu piel después de un facial con dermaplaning",
    slug: "cuidados-despues-dermaplaning-facial",
    excerpt: "Cuidados suaves prolongan el brillo después del dermaplaning en West Edmonton.",
    content: "## Por qué importa el cuidado posterior\n\nLa piel queda más receptiva a la hidratación.",
    coverImage: "/images/services/hydra-facial.jpg",
    language: "es",
    category: "Consejos de piel",
    publishedAt: new Date().toISOString(),
    metaTitle: "Cuidados después del dermaplaning",
    metaDescription: "Consejos de cuidado de la piel después del dermaplaning en Edmonton.",
    author: "Marinelle Tala",
    promoConfig: { enabled: false, ctaUrl: "/book" },
    serviceIds: [],
    translations: [],
    resolvedPromo: PLACEHOLDER_RESOLVED,
  },
  {
    _id: "preview-tl-1",
    translationGroupId: GROUP_A,
    title: "Paano alagaan ang balat pagkatapos ng dermaplaning facial",
    slug: "pag-aalaga-balat-pagkatapos-dermaplaning",
    excerpt: "Malumanay na pag-aalaga pagkatapos ng dermaplaning sa West Edmonton.",
    content: "## Bakit mahalaga ang aftercare\n\nMas madaling humigop ng hydration ang balat.",
    coverImage: "/images/services/hydra-facial.jpg",
    language: "tl",
    category: "Skin care tips",
    publishedAt: new Date().toISOString(),
    metaTitle: "",
    metaDescription: "",
    author: "Marinelle Tala",
    promoConfig: { enabled: false, ctaUrl: "/book" },
    serviceIds: [],
    translations: [],
    resolvedPromo: PLACEHOLDER_RESOLVED,
  },
  {
    _id: "preview-pa-1",
    translationGroupId: GROUP_A,
    title: "ਡਰਮਾਪਲੇਨਿੰਗ ਫੇਸ਼ਲ ਤੋਂ ਬਾਅਦ ਚਮੜੀ ਦੀ ਦੇਖਭਾਲ",
    slug: "dermaplaning-facial-to-baad-skin-care",
    excerpt: "ਡਰਮਾਪਲੇਨਿੰਗ ਤੋਂ ਬਾਅਦ ਨਰਮ ਦੇਖਭਾਲ ਨਾਲ ਗਲੋ ਲੰਬੇ ਸਮੇਂ ਲਈ ਰਹਿੰਦਾ ਹੈ।",
    content: "## ਦੇਖਭਾਲ ਕਿਉਂ ਜ਼ਰੂਰੀ ਹੈ\n\nਚਮੜੀ ਹਾਈਡ੍ਰੇਸ਼ਨ ਲਈ ਜ਼ਿਆਦਾ ਸੰਵੇਦਨਸ਼ੀਲ ਹੁੰਦੀ ਹੈ।",
    coverImage: "/images/services/hydra-facial.jpg",
    language: "pa",
    category: "ਸਕਿਨ ਕੇਅਰ",
    publishedAt: new Date().toISOString(),
    metaTitle: "",
    metaDescription: "",
    author: "Marinelle Tala",
    promoConfig: { enabled: false, ctaUrl: "/book" },
    serviceIds: [],
    translations: [],
    resolvedPromo: PLACEHOLDER_RESOLVED,
  },
  {
    _id: "preview-ar-1",
    translationGroupId: GROUP_A,
    title: "كيفية العناية ببشرتك بعد جلسة ديرمابلانينغ",
    slug: "العناية-بالبشرة-بعد-الديرمابلانينغ",
    excerpt: "عناية لطيفة بعد الديرمابلانينغ في غرب إدمونتون.",
    content: "## لماذا تهم العناية اللاحقة\n\nالبشرة تصبح أكثر جاهزية للترطيب.",
    coverImage: "/images/services/hydra-facial.jpg",
    language: "ar",
    category: "نصائح العناية بالبشرة",
    publishedAt: new Date().toISOString(),
    metaTitle: "",
    metaDescription: "",
    author: "Marinelle Tala",
    promoConfig: { enabled: false, ctaUrl: "/book" },
    serviceIds: [],
    translations: [],
    resolvedPromo: PLACEHOLDER_RESOLVED,
  },
  {
    _id: "preview-en-2",
    translationGroupId: GROUP_B,
    title: "Lash Lift Aftercare: Keep Your Curl for Weeks",
    slug: "lash-lift-aftercare-guide",
    excerpt: "Simple habits protect your lash lift in Edmonton’s dry climate.",
    content: "## Keep them dry at first\n\nAvoid water for 24 hours.",
    coverImage: "/images/services/hybrid-set.jpg",
    language: "en",
    category: "Lashes",
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    metaTitle: "",
    metaDescription: "Lash lift aftercare from Mari Esthetics.",
    author: "Marinelle Tala",
    promoConfig: { enabled: true, promoCode: "GLOW20", ctaUrl: "/book", ctaButtonText: "Book Lash Lift →" },
    serviceIds: [],
    translations: [],
    resolvedPromo: PLACEHOLDER_RESOLVED,
  },
  {
    _id: "preview-en-3",
    translationGroupId: GROUP_C,
    title: "What to Expect at Your First Facial at Mari Esthetics",
    slug: "first-facial-what-to-expect",
    excerpt: "How a private one-on-one facial unfolds in our West Edmonton studio.",
    content: "## A calm consultation\n\nWe start with your skin goals.",
    coverImage: "/images/services/basic-facial.jpg",
    language: "en",
    category: "Studio",
    publishedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    metaTitle: "",
    metaDescription: "",
    author: "Marinelle Tala",
    promoConfig: { enabled: false, ctaUrl: "/book" },
    serviceIds: [],
    translations: [],
    resolvedPromo: PLACEHOLDER_RESOLVED,
  },
];

function buildTranslationIndex(): Map<string, BlogTranslationRef[]> {
  const map = new Map<string, BlogTranslationRef[]>();
  for (const p of PREVIEW) {
    const gid = p.translationGroupId;
    if (!map.has(gid)) map.set(gid, []);
    map.get(gid)!.push({ language: p.language, slug: p.slug, title: p.title });
  }
  return map;
}

const PREVIEW_TRANSLATIONS = buildTranslationIndex();

export function getPreviewListItems(): BlogListItem[] {
  return PREVIEW.map((p) => ({
    _id: p._id,
    translationGroupId: p.translationGroupId,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    language: p.language,
    category: p.category,
    publishedAt: p.publishedAt,
  }));
}

export function getPreviewTranslationsForPost(translationGroupId: string): BlogTranslationRef[] {
  return PREVIEW_TRANSLATIONS.get(translationGroupId) || [];
}

export function getPreviewPostBySlug(slug: string): PublicBlogPost | null {
  const post = PREVIEW.find((p) => p.slug === slug.toLowerCase()) ?? null;
  if (!post) return null;
  return {
    ...post,
    translations: getPreviewTranslationsForPost(post.translationGroupId),
  };
}
