import type { Locale } from "@/components/i18n/LanguageContext";
import { business, siteUrl } from "@/lib/seo";

/** Canonical blog author / studio owner display name. */
export const DEFAULT_BLOG_AUTHOR = "Marinelle Trevino";

/** Legacy DB values and aliases that resolve to the same author profile. */
export const LEGACY_AUTHOR_ALIASES = ["Marinelle Tala"] as const;

const marinelleProfile = {
  slug: "marinelle",
  name: DEFAULT_BLOG_AUTHOR,
  image: undefined as string | undefined,
  jobTitle: { en: "Esthetician, Mari Esthetics", es: "Esteticista, Mari Esthetics", tl: "Esthetician, Mari Esthetics", pa: "ਐਸਥੈਟੀਸ਼ੀਅਨ, Mari Esthetics", ar: "أخصائية تجميل، Mari Esthetics" } as Record<Locale, string>,
  bio: {
    en: "Marinelle Trevino is the esthetician behind Mari Esthetics, a private one-on-one studio in West Edmonton. She does every lash, brow, lip and facial appointment herself and writes the studio's guides.",
    es: "Marinelle Trevino es la esteticista detrás de Mari Esthetics, un estudio privado de atención individual en el oeste de Edmonton. Ella misma realiza cada cita de pestañas, cejas, labios y faciales, y escribe las guías del estudio.",
    tl: "Si Marinelle Trevino ang esthetician ng Mari Esthetics, isang pribadong one-on-one studio sa West Edmonton. Siya mismo ang gumagawa ng bawat lash, brow, lip at facial appointment at sumusulat ng mga gabay ng studio.",
    pa: "Marinelle Trevino, Mari Esthetics ਦੀ ਐਸਥੈਟੀਸ਼ੀਅਨ ਹੈ, ਜੋ ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਇੱਕ ਨਿੱਜੀ ਇੱਕ-ਤੋਂ-ਇੱਕ ਸਟੂਡੀਓ ਹੈ। ਉਹ ਹਰ ਲੈਸ਼, ਬ੍ਰੋ, ਲਿਪ ਅਤੇ ਫੇਸ਼ੀਅਲ ਅਪਾਇੰਟਮੈਂਟ ਖੁਦ ਕਰਦੀ ਹੈ ਅਤੇ ਸਟੂਡੀਓ ਦੀਆਂ ਗਾਈਡਾਂ ਲਿਖਦੀ ਹੈ।",
    ar: "مارينيل تريفينو هي أخصائية التجميل في Mari Esthetics، استوديو خاص بجلسات فردية في غرب إدمونتون. تقوم بنفسها بكل مواعيد الرموش والحواجب والشفاه والفيشيال وتكتب أدلة الاستوديو.",
  } as Record<Locale, string>,
  sameAs: [...business.sameAs] as string[],
};

/**
 * Author profiles. Only facts already stated on the site: name, role at the studio, and the
 * studio Instagram. No credentials or photo are claimed until real ones are added here.
 */
export const AUTHORS = {
  [DEFAULT_BLOG_AUTHOR]: marinelleProfile,
} as const;

export type Author = (typeof AUTHORS)[typeof DEFAULT_BLOG_AUTHOR];

const AUTHOR_LOOKUP: Record<string, Author> = {
  [DEFAULT_BLOG_AUTHOR]: marinelleProfile,
  ...Object.fromEntries(LEGACY_AUTHOR_ALIASES.map((alias) => [alias, marinelleProfile])),
};

export function authorFor(name?: string): Author | null {
  return (name && AUTHOR_LOOKUP[name]) || null;
}

/** Author field values to match in the DB (canonical + legacy aliases). */
export function authorNamesForDbLookup(name: string): string[] {
  const profile = authorFor(name);
  if (profile) return [profile.name, ...LEGACY_AUTHOR_ALIASES];
  return [name];
}

export const authorPath = (a: Author) => `/about/${a.slug}`;

export function personJsonLd(a: Author, locale: Locale) {
  return {
    "@type": "Person",
    "@id": `${siteUrl}${authorPath(a)}#person`,
    name: a.name,
    url: `${siteUrl}${authorPath(a)}`,
    jobTitle: a.jobTitle[locale] || a.jobTitle.en,
    ...(a.image ? { image: a.image } : {}),
    worksFor: { "@id": `${siteUrl}/#business` },
    sameAs: a.sameAs,
  };
}
