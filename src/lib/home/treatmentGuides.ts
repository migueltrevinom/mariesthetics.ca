import type { Locale } from "@/components/i18n/LanguageContext";
import { SERVICE_LANDING_PAGES } from "@/lib/services/landing/registry";
import { isFullSet } from "@/lib/services/landing/lashSummary";
import { isVolumeSet } from "@/lib/services/landing/volumeMatch";
import type { LandingDefinition, LandingKey } from "@/lib/services/landing/types";
import { formatCad } from "@/lib/money";

/** A live service row (only what the cards need). */
export type GuideServiceRow = {
  _id: string;
  name: string;
  slug: string;
  category: string;
  priceCents: number;
  depositCents: number;
  durationMin: number;
  photos: string[];
};

export type GuideGroup = "lashes" | "browsLips" | "facials";

export type TreatmentGuideCard = {
  key: LandingKey;
  group: GuideGroup;
  /** Cheapest bookable service behind this guide (cents); undefined when none is priced. */
  fromCents?: number;
  minDur?: number;
  maxDur?: number;
  image?: string;
};

export const GUIDE_GROUPS: GuideGroup[] = ["lashes", "browsLips", "facials"];

const GROUP_OF: Record<LandingKey, GuideGroup> = {
  "volume-lashes": "lashes",
  "lash-extensions": "lashes",
  "powder-brows": "browsLips",
  "lip-blush": "browsLips",
  "lip-neutralization": "browsLips",
  "facial-west": "facials",
  "hydra-facial": "facials",
  "anti-aging-facial": "facials",
  "deep-cleansing-facial": "facials",
};

const EXCLUDE_FACIAL = /\b(add[- ]?on|mask only)\b/i;
const text = (r: GuideServiceRow) => `${r.name} ${r.slug.replace(/-/g, " ")}`;

/** Services a guide's "from" price may come from: full lash sets only (no fills), no facial add-ons. */
function candidatesFor(def: LandingDefinition, rows: GuideServiceRow[]): GuideServiceRow[] {
  const matched = rows.filter((r) => {
    if (def.match.type === "category") return r.category === def.match.category;
    if (def.match.type === "volumeLashes") return r.category === "lashes";
    return def.match.slugs.includes(r.slug);
  });
  const priced = matched.filter((r) => r.priceCents > 0);
  if (def.key === "volume-lashes") return priced.filter(isVolumeSet);
  if (def.key === "lash-extensions") return priced.filter(isFullSet);
  if (def.match.type === "category" && def.match.category === "facials") {
    return priced.filter((r) => !EXCLUDE_FACIAL.test(text(r)));
  }
  return priced;
}

/** One card per service guide, built only from live DB rows (nothing is invented). */
export function buildTreatmentGuideCards(rows: GuideServiceRow[]): TreatmentGuideCard[] {
  return SERVICE_LANDING_PAGES.map((def) => {
    const cands = candidatesFor(def, rows);
    const cheapest = [...cands].sort((a, b) => a.priceCents - b.priceCents)[0];
    const durs = cands.map((r) => r.durationMin).filter((d) => d > 0);
    const hero = rows.find((r) => r.slug === def.heroServiceSlug && r.photos.length > 0);
    const withPhoto = hero || cands.find((r) => r.photos.length > 0);
    return {
      key: def.key,
      group: GROUP_OF[def.key],
      fromCents: cheapest?.priceCents,
      minDur: durs.length ? Math.min(...durs) : undefined,
      maxDur: durs.length ? Math.max(...durs) : undefined,
      image: withPhoto?.photos[0],
    };
  });
}

/** "$70" for whole dollars, "$72.50" otherwise. */
export const shortPrice = (cents: number) => (cents % 100 === 0 ? `$${cents / 100}` : formatCad(cents));

export function durationLabel(card: Pick<TreatmentGuideCard, "minDur" | "maxDur">, min: string): string | undefined {
  if (!card.minDur) return undefined;
  if (!card.maxDur || card.maxDur === card.minDur) return `${card.minDur} ${min}`;
  return `${card.minDur}–${card.maxDur} ${min}`;
}

/** Rough reading time, same rule as the post page (200 words per minute). */
export function readMinutesFromHtml(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

type GuideCopy = {
  subtitle: string;
  groups: Record<GuideGroup, string>;
  benefit: Record<LandingKey, string>;
  from: (price: string) => string;
  min: string;
  viewGuide: string;
  viewAll: string;
  categories: Record<string, string>;
};

export const GUIDE_COPY: Record<Locale, GuideCopy> = {
  en: {
    subtitle: "Starting prices and appointment times, updated live from our booking system.",
    groups: { lashes: "Lashes", browsLips: "Brows & Lips", facials: "Facials" },
    benefit: {
      "volume-lashes": "Fuller volume lashes, one-on-one in West Edmonton",
      "lash-extensions": "Soft, wearable fullness mapped to your eye shape",
      "powder-brows": "Natural-looking brows for busy routines",
      "lip-blush": "Subtle lip colour, shade chosen with Mari",
      "lip-neutralization": "Corrects cool or uneven lip tones",
      "facial-west": "Calming care for dry, furnace-season skin",
      "hydra-facial": "Deep cleanse and hydration for dry winter skin",
      "anti-aging-facial": "Firming, hydrating care for mature skin",
      "deep-cleansing-facial": "Clears congested skin after heavy makeup weeks",
    },
    from: (p) => `From ${p}`,
    min: "min",
    viewGuide: "View guide",
    viewAll: "View all articles",
    categories: { lashes: "Lashes", facials: "Facials", permanentmakeup: "Brows & Lips", skincare: "Skin care" },
  },
  es: {
    subtitle: "Precios desde y duración de cada cita, actualizados en vivo desde nuestro sistema de reservas.",
    groups: { lashes: "Pestañas", browsLips: "Cejas y labios", facials: "Faciales" },
    benefit: {
      "volume-lashes": "Pestañas de volumen más llenas, atención individual en el oeste de Edmonton",
      "lash-extensions": "Volumen suave y natural, diseñado para la forma de tus ojos",
      "powder-brows": "Cejas de aspecto natural para rutinas ocupadas",
      "lip-blush": "Color sutil en los labios, tono elegido con Mari",
      "lip-neutralization": "Corrige tonos de labios fríos o disparejos",
      "facial-west": "Cuidado relajante para la piel seca en temporada de calefacción",
      "hydra-facial": "Limpieza profunda e hidratación para la piel seca de invierno",
      "anti-aging-facial": "Cuidado reafirmante e hidratante para piel madura",
      "deep-cleansing-facial": "Despeja la piel congestionada tras semanas de mucho maquillaje",
    },
    from: (p) => `Desde ${p}`,
    min: "min",
    viewGuide: "Ver guía",
    viewAll: "Ver todos los artículos",
    categories: { lashes: "Pestañas", facials: "Faciales", permanentmakeup: "Cejas y labios", skincare: "Cuidado de la piel" },
  },
  tl: {
    subtitle: "Panimulang presyo at tagal ng appointment, live mula sa aming booking system.",
    groups: { lashes: "Lashes", browsLips: "Brows at Lips", facials: "Facials" },
    benefit: {
      "volume-lashes": "Mas punong volume lashes, one-on-one sa West Edmonton",
      "lash-extensions": "Malambot at natural na kapal, ayon sa hugis ng mata mo",
      "powder-brows": "Natural na brows para sa abalang araw-araw",
      "lip-blush": "Banayad na kulay ng labi, pinili kasama si Mari",
      "lip-neutralization": "Inaayos ang malamig o hindi pantay na kulay ng labi",
      "facial-west": "Nakaka-relax na alaga para sa tuyong balat ngayong may heater",
      "hydra-facial": "Malalim na linis at hydration para sa tuyong balat sa taglamig",
      "anti-aging-facial": "Pampa-firm at pang-hydrate na alaga para sa mature na balat",
      "deep-cleansing-facial": "Nililinis ang baradong balat pagkatapos ng mga linggong puno ng makeup",
    },
    from: (p) => `Mula ${p}`,
    min: "min",
    viewGuide: "Tingnan ang gabay",
    viewAll: "Tingnan lahat ng artikulo",
    categories: { lashes: "Lashes", facials: "Facials", permanentmakeup: "Brows at Lips", skincare: "Skin care" },
  },
  pa: {
    subtitle: "ਸ਼ੁਰੂਆਤੀ ਕੀਮਤਾਂ ਅਤੇ ਅਪਾਇੰਟਮੈਂਟ ਦਾ ਸਮਾਂ, ਸਾਡੇ ਬੁਕਿੰਗ ਸਿਸਟਮ ਤੋਂ ਲਾਈਵ।",
    groups: { lashes: "ਲੈਸ਼", browsLips: "ਬ੍ਰੋਜ਼ ਅਤੇ ਲਿਪਸ", facials: "ਫੇਸ਼ੀਅਲ" },
    benefit: {
      "volume-lashes": "ਵਧੇਰੇ ਭਰੀਆਂ ਵਾਲਿਊਮ ਲੈਸ਼, ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਇੱਕ-ਤੋਂ-ਇੱਕ",
      "lash-extensions": "ਤੁਹਾਡੀਆਂ ਅੱਖਾਂ ਦੀ ਸ਼ਕਲ ਮੁਤਾਬਕ ਨਰਮ, ਕੁਦਰਤੀ ਭਰਪੂਰਤਾ",
      "powder-brows": "ਰੁੱਝੀ ਰੁਟੀਨ ਲਈ ਕੁਦਰਤੀ ਦਿੱਖ ਵਾਲੇ ਬ੍ਰੋਜ਼",
      "lip-blush": "ਬੁੱਲ੍ਹਾਂ ਲਈ ਹਲਕਾ ਰੰਗ, ਸ਼ੇਡ Mari ਨਾਲ ਮਿਲ ਕੇ ਚੁਣਿਆ",
      "lip-neutralization": "ਠੰਢੇ ਜਾਂ ਅਸਮਾਨ ਬੁੱਲ੍ਹਾਂ ਦੇ ਰੰਗ ਨੂੰ ਠੀਕ ਕਰਦਾ ਹੈ",
      "facial-west": "ਹੀਟਰ ਵਾਲੇ ਮੌਸਮ ਦੀ ਸੁੱਕੀ ਸਕਿਨ ਲਈ ਆਰਾਮਦਾਇਕ ਦੇਖਭਾਲ",
      "hydra-facial": "ਸਰਦੀਆਂ ਦੀ ਸੁੱਕੀ ਸਕਿਨ ਲਈ ਡੂੰਘੀ ਸਫ਼ਾਈ ਅਤੇ ਨਮੀ",
      "anti-aging-facial": "ਪਰਿਪੱਕ ਸਕਿਨ ਲਈ ਕਸਾਅ ਅਤੇ ਨਮੀ ਦੇਣ ਵਾਲੀ ਦੇਖਭਾਲ",
      "deep-cleansing-facial": "ਭਾਰੀ ਮੇਕਅੱਪ ਵਾਲੇ ਹਫ਼ਤਿਆਂ ਤੋਂ ਬਾਅਦ ਬੰਦ ਰੋਮਾਂ ਵਾਲੀ ਸਕਿਨ ਸਾਫ਼ ਕਰਦਾ ਹੈ",
    },
    from: (p) => `${p} ਤੋਂ ਸ਼ੁਰੂ`,
    min: "ਮਿੰਟ",
    viewGuide: "ਗਾਈਡ ਵੇਖੋ",
    viewAll: "ਸਾਰੇ ਲੇਖ ਵੇਖੋ",
    categories: { lashes: "ਲੈਸ਼", facials: "ਫੇਸ਼ੀਅਲ", permanentmakeup: "ਬ੍ਰੋਜ਼ ਅਤੇ ਲਿਪਸ", skincare: "ਸਕਿਨ ਕੇਅਰ" },
  },
  ar: {
    subtitle: "الأسعار الابتدائية ومدة كل موعد، محدّثة مباشرة من نظام الحجز لدينا.",
    groups: { lashes: "الرموش", browsLips: "الحواجب والشفاه", facials: "الفيشيال" },
    benefit: {
      "volume-lashes": "رموش فوليوم أكثف، جلسة فردية في غرب إدمونتون",
      "lash-extensions": "كثافة ناعمة وطبيعية مصممة لشكل عينيك",
      "powder-brows": "حواجب بمظهر طبيعي تناسب روتينك المزدحم",
      "lip-blush": "لون شفاه ناعم، تختارين درجته مع ماري",
      "lip-neutralization": "يصحّح درجات الشفاه الباردة أو غير المتساوية",
      "facial-west": "عناية مريحة للبشرة الجافة في موسم التدفئة",
      "hydra-facial": "تنظيف عميق وترطيب للبشرة الجافة في الشتاء",
      "anti-aging-facial": "عناية مشدّة ومرطّبة للبشرة الناضجة",
      "deep-cleansing-facial": "ينقّي البشرة المحتقنة بعد أسابيع من المكياج الكثيف",
    },
    from: (p) => `ابتداءً من ${p}`,
    min: "دقيقة",
    viewGuide: "عرض الدليل",
    viewAll: "عرض كل المقالات",
    categories: { lashes: "الرموش", facials: "الفيشيال", permanentmakeup: "الحواجب والشفاه", skincare: "العناية بالبشرة" },
  },
};

/** Localized tag for a blog category; undefined for categories we have no label for. */
export function categoryTag(category: string | undefined, locale: Locale): string | undefined {
  if (!category) return undefined;
  const c = GUIDE_COPY[locale] || GUIDE_COPY.en;
  return c.categories[category.toLowerCase().replace(/[^a-z]/g, "")];
}
