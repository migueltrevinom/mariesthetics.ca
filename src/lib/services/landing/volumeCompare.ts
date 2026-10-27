/**
 * Competitor volume prices checked 2026-10-27.
 * Every figure has a source URL and a checked date. The page sentence is computed from this list.
 * Mari is "self" and is not part of the competitor range. The nail salon is stored so the page
 * says "one of the lowest-priced" and never "the cheapest".
 */
export type VolumePriceCheck = {
  studio: string;
  sourceUrl: string;
  checked: string;
  fullSetCad: number | null;
  fillCad: number | null;
  kind: "lash-studio" | "nail-salon" | "self";
};

export const VOLUME_PRICE_CHECKS: VolumePriceCheck[] = [
  { studio: "Mari Esthetics", sourceUrl: "https://mariesthetics.ca/api/services", checked: "2026-10-27", fullSetCad: 100, fillCad: 70, kind: "self" },
  { studio: "Urban Brows", sourceUrl: "https://www.urbanbrows.com/services/volume-lashes", checked: "2026-10-27", fullSetCad: 225, fillCad: 195, kind: "lash-studio" },
  { studio: "Lash Up", sourceUrl: "https://lashup.ca/services/", checked: "2026-10-27", fullSetCad: 200, fillCad: 105, kind: "lash-studio" },
  { studio: "Lotus Laser Skin", sourceUrl: "https://lotuslaserskin.com/procedure/lash-extensions/", checked: "2026-10-27", fullSetCad: 190, fillCad: 100, kind: "lash-studio" },
  { studio: "The Makeup Parlour", sourceUrl: "https://themakeupparlour.ca/beauty-services", checked: "2026-10-27", fullSetCad: 185, fillCad: 85, kind: "lash-studio" },
  { studio: "Elite Spa", sourceUrl: "https://www.elitewellnessbeautyspa.com/service-page/russian-volume-4d-6d-lash-extensions", checked: "2026-10-27", fullSetCad: 185, fillCad: null, kind: "lash-studio" },
  { studio: "Studio N", sourceUrl: "https://www.studionbeauty.com/lash-extensions", checked: "2026-10-27", fullSetCad: 180, fillCad: 100, kind: "lash-studio" },
  { studio: "GLASS + SKIN", sourceUrl: "https://www.glassandskin.com/lash-extensions", checked: "2026-10-27", fullSetCad: 180, fillCad: 100, kind: "lash-studio" },
  { studio: "Honeypot Lashes", sourceUrl: "https://www.honeypotlashes.com/lashextensions", checked: "2026-10-27", fullSetCad: 180, fillCad: 110, kind: "lash-studio" },
  { studio: "Brow Envy", sourceUrl: "https://browenvyedmonton.ca/services/lash-extensions/", checked: "2026-10-27", fullSetCad: 170, fillCad: null, kind: "lash-studio" },
  { studio: "Studio XO", sourceUrl: "https://studioxo.ca/lashes", checked: "2026-10-27", fullSetCad: 170, fillCad: 95, kind: "lash-studio" },
  { studio: "Best Lashes", sourceUrl: "https://www.bestlashes.ca/product/volume-full-set/", checked: "2026-10-27", fullSetCad: 170, fillCad: null, kind: "lash-studio" },
  { studio: "Lash Veda Beauty", sourceUrl: "https://mickeyego8.setmore.com/", checked: "2026-10-27", fullSetCad: 160, fillCad: null, kind: "lash-studio" },
  { studio: "Studio Vanassa", sourceUrl: "https://www.studiovanassa.com/lashes-brows", checked: "2026-10-27", fullSetCad: 158, fillCad: 84, kind: "lash-studio" },
  { studio: "Lashes by Hana", sourceUrl: "https://lashesbyhana.setmore.com/book", checked: "2026-10-27", fullSetCad: 140, fillCad: null, kind: "lash-studio" },
  { studio: "Maybloom Beauty", sourceUrl: "https://maybloombeauty.setmore.com/book", checked: "2026-10-27", fullSetCad: 140, fillCad: 80, kind: "lash-studio" },
  { studio: "Hannah's Lash Lounge", sourceUrl: "https://hannahslashlounge.setmore.com/", checked: "2026-10-27", fullSetCad: 115, fillCad: 85, kind: "lash-studio" },
  { studio: "Binhs Nails Meadowlark", sourceUrl: "https://binhsnails.com/", checked: "2026-10-27", fullSetCad: 95, fillCad: null, kind: "nail-salon" },
];

export type VolumeStudioRange = { min: number; max: number; checked: string; sources: VolumePriceCheck[] };

/** Full-set range across dedicated lash studios (not Mari, not nail salons). Null when nothing is sourced. */
export function volumeLashStudioSetRange(checks: VolumePriceCheck[] = VOLUME_PRICE_CHECKS): VolumeStudioRange | null {
  const sources = checks.filter(
    (row) => row.kind === "lash-studio" && row.fullSetCad != null && row.sourceUrl && row.checked
  );
  if (!sources.length) return null;
  const prices = sources.map((row) => row.fullSetCad as number);
  const checked = sources.map((row) => row.checked).sort().at(-1) as string;
  return { min: Math.min(...prices), max: Math.max(...prices), checked, sources };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatCheckedDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}
