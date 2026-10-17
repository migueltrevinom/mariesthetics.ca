import type { Locale } from "@/components/i18n/LanguageContext";
import { formatCad } from "@/lib/money";

type Row = { _id: string; name: string; slug: string; category: string; priceCents: number; depositCents: number; durationMin: number };

export type LashType = "classic" | "hybrid" | "volume";
export type LashLine = { type: LashType; set?: Row; fill?: Row };
export type LashSummary = { lines: LashLine[]; minSet?: Row; minFill?: Row; minDeposit?: number; maxDeposit?: number; minDur?: number; maxDur?: number };

const EXCLUDE = /\b(lift|lifts|removal|remove|tint|tinting)\b/i;
const text = (r: Row) => `${r.name} ${r.slug.replace(/-/g, " ")}`;
export const isFullSet = (r: Row) => r.category === "lashes" && /\bset\b/i.test(text(r)) && !/\b(fill|fills|refill|refills)\b/i.test(text(r)) && !EXCLUDE.test(text(r));
export const isFill = (r: Row) => r.category === "lashes" && /\b(fill|fills|refill|refills)\b/i.test(text(r)) && !EXCLUDE.test(text(r));
const typeOf = (r: Row): LashType | null =>
  /\bhybrid\b/i.test(text(r)) ? "hybrid" : /\bvolume\b/i.test(text(r)) ? "volume" : /\bclassic\b/i.test(text(r)) ? "classic" : null;
const cheapest = (rows: Row[]) => rows.filter((r) => r.priceCents > 0).sort((a, b) => a.priceCents - b.priceCents)[0];

/** Built only from live DB service rows; types without a priced full set are dropped. */
export function buildLashSummary(rows: Row[]): LashSummary | null {
  const sets = rows.filter(isFullSet);
  const fills = rows.filter(isFill);
  const lines: LashLine[] = (["classic", "hybrid", "volume"] as LashType[])
    .map((type) => ({
      type,
      set: cheapest(sets.filter((r) => typeOf(r) === type)),
      fill: cheapest(fills.filter((r) => typeOf(r) === type)),
    }))
    .filter((l) => l.set);
  if (!lines.length) return null;
  const used = lines.flatMap((l) => [l.set!, ...(l.fill ? [l.fill] : [])]);
  const deps = used.map((r) => r.depositCents).filter((d) => d > 0);
  const durs = lines.map((l) => l.set!.durationMin).filter((d) => d > 0);
  return {
    lines,
    minSet: cheapest(lines.map((l) => l.set!)),
    minFill: cheapest(lines.flatMap((l) => (l.fill ? [l.fill] : []))),
    minDeposit: deps.length ? Math.min(...deps) : undefined,
    maxDeposit: deps.length ? Math.max(...deps) : undefined,
    minDur: durs.length ? Math.min(...durs) : undefined,
    maxDur: durs.length ? Math.max(...durs) : undefined,
  };
}

type Copy = {
  heading: string; type: Record<LashType, string>; fullSet: string; fill: string; length: string; deposit: string;
  fillRule: string; book: (t: string) => string; min: string; credited: string;
  faq: {
    setsQ: string; setsA: (list: string) => string;
    fillQ: string; fillA: (p: string) => string;
    lenQ: string; lenA: (r: string) => string;
    depQ: string; depA: (r: string) => string;
  };
};

export const LASH_COPY: Record<Locale, Copy> = {
  en: {
    heading: "At a glance", type: { classic: "Classic", hybrid: "Hybrid", volume: "Volume" }, fullSet: "Full set", fill: "Fill", length: "Appointment", deposit: "Deposit",
    fillRule: "Fills every 2–3 weeks, while 40–50% of your extensions remain. Less than that needs a new full set.",
    book: (t) => `Book ${t}`, min: "min", credited: "credited to your total",
    faq: {
      setsQ: "How much are lash extensions in West Edmonton?", setsA: (l) => `Full sets at Mari Esthetics: ${l}.`,
      fillQ: "How often do I need a lash fill, and how much is it?", fillA: (p) => `Book a fill every 2–3 weeks, while at least 40–50% of your extensions remain. Fills start at ${p}.`,
      lenQ: "How long is a lash extension appointment?", lenA: (r) => `A full set takes about ${r}.`,
      depQ: "Is there a deposit for lash extensions?", depA: (r) => `Yes, a ${r} deposit holds your appointment and is credited to your total.`,
    },
  },
  es: {
    heading: "De un vistazo", type: { classic: "Clásicas", hybrid: "Híbridas", volume: "Volumen" }, fullSet: "Set completo", fill: "Relleno", length: "Duración", deposit: "Depósito",
    fillRule: "Relleno cada 2–3 semanas, mientras conserves el 40–50% de tus extensiones. Con menos, se necesita un set nuevo.",
    book: (t) => `Reservar ${t}`, min: "min", credited: "se descuenta del total",
    faq: {
      setsQ: "¿Cuánto cuestan las extensiones de pestañas en el oeste de Edmonton?", setsA: (l) => `Sets completos en Mari Esthetics: ${l}.`,
      fillQ: "¿Cada cuánto necesito un relleno y cuánto cuesta?", fillA: (p) => `Agenda un relleno cada 2–3 semanas, mientras conserves al menos el 40–50% de tus extensiones. Los rellenos empiezan en ${p}.`,
      lenQ: "¿Cuánto dura una cita de extensiones de pestañas?", lenA: (r) => `Un set completo toma aproximadamente ${r}.`,
      depQ: "¿Hay depósito para las extensiones de pestañas?", depA: (r) => `Sí, un depósito de ${r} reserva tu cita y se descuenta del total.`,
    },
  },
  tl: {
    heading: "Sa madaling sabi", type: { classic: "Classic", hybrid: "Hybrid", volume: "Volume" }, fullSet: "Full set", fill: "Fill", length: "Tagal", deposit: "Deposit",
    fillRule: "Mag-fill tuwing 2–3 linggo, habang 40–50% pa ng extensions mo ang natitira. Kapag mas kaunti, kailangan ng bagong full set.",
    book: (t) => `I-book ang ${t}`, min: "min", credited: "ibabawas sa kabuuan",
    faq: {
      setsQ: "Magkano ang lash extensions sa West Edmonton?", setsA: (l) => `Full sets sa Mari Esthetics: ${l}.`,
      fillQ: "Gaano kadalas ang lash fill at magkano ito?", fillA: (p) => `Mag-book ng fill tuwing 2–3 linggo, habang hindi bababa sa 40–50% ng extensions ang natitira. Nagsisimula ang fills sa ${p}.`,
      lenQ: "Gaano katagal ang lash extension appointment?", lenA: (r) => `Ang full set ay mga ${r}.`,
      depQ: "May deposit ba para sa lash extensions?", depA: (r) => `Oo, ${r} na deposit ang magre-reserve ng appointment mo at ibabawas ito sa kabuuan.`,
    },
  },
  pa: {
    heading: "ਇੱਕ ਨਜ਼ਰ ਵਿੱਚ", type: { classic: "ਕਲਾਸਿਕ", hybrid: "ਹਾਈਬ੍ਰਿਡ", volume: "ਵਾਲਿਊਮ" }, fullSet: "ਫੁੱਲ ਸੈੱਟ", fill: "ਫਿੱਲ", length: "ਸਮਾਂ", deposit: "ਡਿਪਾਜ਼ਿਟ",
    fillRule: "ਹਰ 2–3 ਹਫ਼ਤਿਆਂ ਬਾਅਦ ਫਿੱਲ, ਜਦੋਂ ਤੱਕ 40–50% ਐਕਸਟੈਂਸ਼ਨ ਬਾਕੀ ਹਨ। ਇਸ ਤੋਂ ਘੱਟ ਹੋਣ 'ਤੇ ਨਵਾਂ ਫੁੱਲ ਸੈੱਟ ਚਾਹੀਦਾ ਹੈ।",
    book: (t) => `${t} ਬੁੱਕ ਕਰੋ`, min: "ਮਿੰਟ", credited: "ਕੁੱਲ ਵਿੱਚੋਂ ਘਟਾਈ ਜਾਂਦੀ ਹੈ",
    faq: {
      setsQ: "ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ ਦੀ ਕੀਮਤ ਕਿੰਨੀ ਹੈ?", setsA: (l) => `Mari Esthetics ਵਿੱਚ ਫੁੱਲ ਸੈੱਟ: ${l}।`,
      fillQ: "ਲੈਸ਼ ਫਿੱਲ ਕਿੰਨੀ ਵਾਰ ਚਾਹੀਦੀ ਹੈ ਅਤੇ ਕੀਮਤ ਕੀ ਹੈ?", fillA: (p) => `ਹਰ 2–3 ਹਫ਼ਤਿਆਂ ਬਾਅਦ ਫਿੱਲ ਬੁੱਕ ਕਰੋ, ਜਦੋਂ ਤੱਕ ਘੱਟੋ-ਘੱਟ 40–50% ਐਕਸਟੈਂਸ਼ਨ ਬਾਕੀ ਹਨ। ਫਿੱਲ ${p} ਤੋਂ ਸ਼ੁਰੂ।`,
      lenQ: "ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ ਅਪਾਇੰਟਮੈਂਟ ਕਿੰਨਾ ਸਮਾਂ ਲੈਂਦੀ ਹੈ?", lenA: (r) => `ਫੁੱਲ ਸੈੱਟ ਲਗਭਗ ${r} ਲੈਂਦਾ ਹੈ।`,
      depQ: "ਕੀ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ ਲਈ ਡਿਪਾਜ਼ਿਟ ਹੈ?", depA: (r) => `ਹਾਂ, ${r} ਡਿਪਾਜ਼ਿਟ ਤੁਹਾਡੀ ਅਪਾਇੰਟਮੈਂਟ ਰਿਜ਼ਰਵ ਕਰਦੀ ਹੈ ਅਤੇ ਕੁੱਲ ਵਿੱਚੋਂ ਘਟਾਈ ਜਾਂਦੀ ਹੈ।`,
    },
  },
  ar: {
    heading: "نظرة سريعة", type: { classic: "كلاسيك", hybrid: "هايبرد", volume: "فوليوم" }, fullSet: "مجموعة كاملة", fill: "تعبئة", length: "مدة الموعد", deposit: "العربون",
    fillRule: "تعبئة كل 2–3 أسابيع ما دام 40–50% من الرموش باقياً. إذا قلّ عن ذلك تحتاجين مجموعة كاملة جديدة.",
    book: (t) => `احجزي ${t}`, min: "دقيقة", credited: "يُخصم من المبلغ الإجمالي",
    faq: {
      setsQ: "كم سعر وصلات الرموش في غرب إدمونتون؟", setsA: (l) => `المجموعات الكاملة في Mari Esthetics: ${l}.`,
      fillQ: "كم مرة أحتاج تعبئة الرموش وكم سعرها؟", fillA: (p) => `احجزي تعبئة كل 2–3 أسابيع ما دام 40–50% على الأقل من الرموش باقياً. تبدأ التعبئة من ${p}.`,
      lenQ: "كم تستغرق جلسة وصلات الرموش؟", lenA: (r) => `تستغرق المجموعة الكاملة حوالي ${r}.`,
      depQ: "هل يوجد عربون لوصلات الرموش؟", depA: (r) => `نعم، عربون ${r} يحجز موعدك ويُخصم من المبلغ الإجمالي.`,
    },
  },
};

const range = (a?: number, b?: number, f: (n: number) => string = String) =>
  a == null ? "" : a === b || b == null ? f(a) : `${f(a)}–${f(b)}`;

export function lashRanges(s: LashSummary, locale: Locale) {
  const c = LASH_COPY[locale] || LASH_COPY.en;
  return {
    deposit: range(s.minDeposit, s.maxDeposit, formatCad),
    length: s.minDur ? `${range(s.minDur, s.maxDur)} ${c.min}` : "",
  };
}

export function buildLashFaq(s: LashSummary, locale: Locale): Array<{ q: string; a: string }> {
  const c = LASH_COPY[locale] || LASH_COPY.en;
  const r = lashRanges(s, locale);
  const items = [{ q: c.faq.setsQ, a: c.faq.setsA(s.lines.map((l) => `${c.type[l.type]} ${formatCad(l.set!.priceCents)}`).join(", ")) }];
  if (s.minFill) items.push({ q: c.faq.fillQ, a: c.faq.fillA(formatCad(s.minFill.priceCents)) });
  if (r.length) items.push({ q: c.faq.lenQ, a: c.faq.lenA(r.length) });
  if (r.deposit) items.push({ q: c.faq.depQ, a: c.faq.depA(r.deposit) });
  return items;
}

/** Short keyword lead for the price title, per locale. */
const PRICE_TITLE_LEAD: Record<Locale, string> = {
  en: "Lash Extensions Edmonton",
  es: "Extensiones de Pestañas Edmonton",
  tl: "Lash Extensions Edmonton",
  pa: "ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ ਐਡਮਿੰਟਨ",
  ar: "وصلات الرموش إدمونتون",
};

/** "$70" for whole dollars, "$72.50" otherwise. */
const titlePrice = (cents: number) =>
  cents % 100 === 0 ? `$${cents / 100}` : formatCad(cents);

export const PRICE_TITLE_MAX = 65;

/**
 * Title with live full-set prices from the DB, e.g.
 * "Lash Extensions Edmonton | Classic $70 · Hybrid $90 · Volume $100".
 * `withBrand` is true only when "<title> · <brand>" still fits in PRICE_TITLE_MAX;
 * otherwise the caller should render the title without the brand suffix. Null when no priced sets.
 */
export function lashPriceTitle(s: LashSummary | null, locale: Locale, brand: string): { title: string; withBrand: boolean } | null {
  if (!s || !s.lines.length) return null;
  const c = LASH_COPY[locale] || LASH_COPY.en;
  const prices = s.lines.map((l) => `${c.type[l.type]} ${titlePrice(l.set!.priceCents)}`).join(" · ");
  const base = `${PRICE_TITLE_LEAD[locale] || PRICE_TITLE_LEAD.en} | ${prices}`;
  return { title: base, withBrand: `${base} · ${brand}`.length <= PRICE_TITLE_MAX };
}
