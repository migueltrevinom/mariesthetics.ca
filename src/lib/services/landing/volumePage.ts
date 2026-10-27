import type { Locale } from "@/components/i18n/LanguageContext";
import { formatDurationRange } from "./durations";
import { PRICE_TITLE_MAX } from "./lashSummary";
import { business, siteUrl } from "@/lib/seo";
import { formatCheckedDate, volumeLashStudioSetRange, type VolumeStudioRange } from "./volumeCompare";
import { VOLUME_COPY, wholeDollar } from "./volumeCopy";
import { pickVolumePair, type VolumeServiceRef } from "./volumeMatch";

export type VolumePriced = VolumeServiceRef & {
  _id: string;
  name: string;
  description?: string;
  priceCents: number;
  depositCents?: number;
  durationMin?: number;
};

const DENSITY = /(\d+)\s*D\s*[–-]\s*(\d+)\s*D/i;

export function densityLabel(name: string | undefined): string | null {
  const match = (name || "").match(DENSITY);
  return match ? `${match[1]}D–${match[2]}D` : null;
}

function money(cents: number | undefined): string | undefined {
  if (cents == null || !(cents > 0)) return undefined;
  return wholeDollar(cents);
}

const PRICE_BITS: Record<Locale, { set: string; fill: string; deposit: string }> = {
  en: { set: "Full set", fill: "fill", deposit: "deposit" },
  es: { set: "Set completo", fill: "relleno", deposit: "depósito" },
  tl: { set: "Full set", fill: "fill", deposit: "deposit" },
  pa: { set: "ਫੁੱਲ ਸੈੱਟ", fill: "ਫਿੱਲ", deposit: "ਡਿਪਾਜ਼ਿਟ" },
  ar: { set: "مجموعة كاملة", fill: "تعبئة", deposit: "عربون" },
};

function priceClause(
  locale: Locale,
  set?: string,
  fill?: string,
  deposit?: string
): string {
  const w = PRICE_BITS[locale] || PRICE_BITS.en;
  const bits = [
    set ? `${w.set} ${set}` : "",
    fill ? `${w.fill} ${fill}` : "",
    deposit ? `${deposit} ${w.deposit}` : "",
  ].filter(Boolean);
  return bits.length ? `${bits.join(", ")}.` : "";
}

export function buildVolumeHead(
  rows: VolumePriced[],
  locale: Locale,
  brand: string
): { title: string; withBrand: boolean; description: string } | null {
  const { set, fill } = pickVolumePair(rows);
  const setPrice = money(set?.priceCents);
  const fillPrice = money(fill?.priceCents);
  if (!setPrice && !fillPrice) return null;
  const c = VOLUME_COPY[locale] || VOLUME_COPY.en;
  const prices = [setPrice ? `${c.titleSet} ${setPrice}` : "", fillPrice ? `${c.titleFill} ${fillPrice}` : ""]
    .filter(Boolean)
    .join(" · ");
  const title = `${c.titleLead} | ${prices}`;
  const density = densityLabel(set?.name);
  const lead = density
    ? locale === "es"
      ? `Extensiones de pestañas de volumen ${density}`
      : locale === "pa"
        ? `${density} ਵਾਲਿਊਮ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ`
        : locale === "ar"
          ? `وصلات رموش فوليوم ${density}`
          : `${density} volume lash extensions`
    : locale === "es"
      ? "Extensiones de pestañas de volumen"
      : locale === "pa"
        ? "ਵਾਲਿਊਮ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ"
        : locale === "ar"
          ? "وصلات رموش فوليوم"
          : "Volume lash extensions";
  const deposits = [set?.depositCents, fill?.depositCents].filter((n): n is number => !!n && n > 0);
  const deposit = deposits.length ? money(Math.min(...deposits)) : undefined;
  const description = c.meta({
    density: lead,
    prices: priceClause(locale, setPrice, fillPrice, deposit),
  }).replace(/\s+/g, " ").trim();
  return { title, withBrand: `${title} · ${brand}`.length <= PRICE_TITLE_MAX, description };
}

export function buildVolumeFaqs(
  rows: VolumePriced[],
  locale: Locale,
  parkaUrl?: string
): Array<{ q: string; a: string }> {
  const { set, fill } = pickVolumePair(rows);
  const c = VOLUME_COPY[locale] || VOLUME_COPY.en;
  const faqs: Array<{ q: string; a: string }> = [];
  const line = (row: VolumePriced | undefined, label: string) => {
    if (!row || !(row.priceCents > 0)) return "";
    const duration = row.durationMin && row.durationMin > 0 ? formatDurationRange([row.durationMin], locale) : "";
    return [label, money(row.priceCents), duration ? `(${duration})` : ""].filter(Boolean).join(" ");
  };
  const costLines = [line(set, set?.name || c.titleSet), line(fill, fill?.name || c.titleFill)].filter(Boolean);
  if (costLines.length) faqs.push({ q: c.costQ, a: c.costA(costLines.join("; ")) });
  const lengthLines = [set, fill]
    .filter((row): row is VolumePriced => !!row && !!row.durationMin && row.durationMin > 0)
    .map((row) => `${row.name}: ${formatDurationRange([row.durationMin!], locale)}`);
  if (lengthLines.length) faqs.push({ q: c.lengthQ, a: c.lengthA(lengthLines.join(". ") + ".") });
  const fillDescription = (fill?.description || "").trim();
  if (fillDescription) faqs.push({ q: c.fillQ, a: `${c.fillIntro} ${fillDescription}` });
  if (parkaUrl) faqs.push({ q: c.vsQ, a: c.vsA(parkaUrl) });
  faqs.push({ q: c.prepQ, a: c.prepA });
  const depositBits = [set, fill]
    .filter((row): row is VolumePriced => !!row && !!row.depositCents && row.depositCents > 0)
    .map((row) => `${row.name} ${money(row.depositCents)}`);
  if (depositBits.length) faqs.push({ q: c.depositQ, a: c.depositA(depositBits.join("; ") + ".") });
  return faqs;
}

export function volumeCompareLine(locale: Locale, range: VolumeStudioRange | null = volumeLashStudioSetRange()): { sentence: string; lowest: string } | null {
  if (!range) return null;
  const c = VOLUME_COPY[locale] || VOLUME_COPY.en;
  const min = wholeDollar(range.min * 100);
  const max = wholeDollar(range.max * 100);
  return {
    sentence: c.compareSentence(min, max, formatCheckedDate(range.checked)),
    lowest: c.lowestLine,
  };
}

export function volumeServiceJsonLd(input: {
  name: string;
  description: string;
  url: string;
  image?: string;
  services: VolumePriced[];
}) {
  const image = input.image
    ? input.image.startsWith("http")
      ? input.image
      : `${siteUrl}${input.image}`
    : `${siteUrl}/opengraph-image`;
  const businessId = `${siteUrl}/#business`;
  const personId = `${siteUrl}/about/marinelle#person`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Volume lash extensions",
    name: input.name,
    description: input.description,
    provider: [{ "@id": businessId }, { "@id": personId }],
    areaServed: business.areasServed.map((name) => ({ "@type": "City", name })),
    image,
    url: input.url,
    offers: input.services
      .filter((s) => s.priceCents > 0)
      .map((s) => ({
        "@type": "Offer",
        name: s.name,
        ...(s.description ? { description: s.description } : {}),
        priceCurrency: business.currency,
        price: (s.priceCents / 100).toFixed(2),
        ...(s.durationMin && s.durationMin > 0 ? { eligibleDuration: `PT${Math.round(s.durationMin)}M` } : {}),
        ...(s.depositCents && s.depositCents > 0
          ? {
              priceSpecification: {
                "@type": "PriceSpecification",
                name: "Deposit",
                priceCurrency: business.currency,
                price: (s.depositCents / 100).toFixed(2),
              },
            }
          : {}),
        availability: "https://schema.org/InStock",
        url: `${siteUrl}/book?serviceId=${s._id}`,
      })),
  };
}
