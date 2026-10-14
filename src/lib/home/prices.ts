import type { HomePrices } from "./seo";

export type PricedService = { slug: string; name: string; category: string; priceCents: number };

const EXCLUDE_LASH = /\b(fill|fills|refill|refills|lift|lifts|removal|remove|tint|tinting)\b/i;
const EXCLUDE_BROW = /\b(tint|tinting|lamination|removal|touch[- ]?up|shaping|wax)\b/i;
const EXCLUDE_FACIAL = /\b(add[- ]?on|mask only)\b/i;

const text = (s: PricedService) => `${s.name} ${s.slug.replace(/-/g, " ")}`;

/** Cheapest priced service matching a predicate, with which service it came from. */
function cheapest(rows: PricedService[], pred: (s: PricedService) => boolean) {
  const hits = rows.filter((r) => r.priceCents > 0 && pred(r)).sort((a, b) => a.priceCents - b.priceCents);
  return hits[0];
}

/** Starting prices per FAQ topic, computed only from real service rows. */
export function computeHomePrices(rows: PricedService[]): HomePrices & { sources: Record<string, string> } {
  const lash = cheapest(rows, (s) => s.category === "lashes" && /\bset\b/i.test(text(s)) && !EXCLUDE_LASH.test(text(s)));
  const facial = cheapest(rows, (s) => s.category === "facials" && /facial/i.test(text(s)) && !EXCLUDE_FACIAL.test(text(s)));
  const brow = cheapest(rows, (s) => /powder\s*brows?/i.test(text(s)) && !EXCLUDE_BROW.test(text(s)));
  const lip = cheapest(rows, (s) => /lip\s*blush/i.test(text(s)));
  const sources: Record<string, string> = {};
  if (lash) sources.lashes = lash.name;
  if (facial) sources.facials = facial.name;
  if (brow) sources.powderBrows = brow.name;
  if (lip) sources.lipBlush = lip.name;
  return { lashes: lash?.priceCents, facials: facial?.priceCents, powderBrows: brow?.priceCents, lipBlush: lip?.priceCents, sources };
}
