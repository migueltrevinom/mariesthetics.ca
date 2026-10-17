import type { OpeningHoursSpec } from "@/lib/businessHours";

/**
 * Pure, client-safe formatting of the admin weekly schedule (schema.org specs from
 * getOpeningHoursSpec) into short human lines, e.g. "Mon – Wed · 8:00 a.m. – 8:00 p.m.".
 * Never invents hours: no specs -> no lines, so callers hide the hours block.
 */

type SpecLike = Pick<OpeningHoursSpec, "dayOfWeek" | "opens" | "closes">;

const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};
// Display week starts on Monday.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

const INTL_LOCALE: Record<string, string> = {
  en: "en-CA", es: "es-MX", tl: "fil-PH", pa: "pa-IN", ar: "ar",
};

const CLOSED: Record<string, string> = {
  en: "Closed", es: "Cerrado", tl: "Sarado", pa: "ਬੰਦ", ar: "مغلق",
};

const intlLocale = (locale: string) => INTL_LOCALE[locale] || "en-CA";

function dayName(day: number, locale: string): string {
  // 2024-01-07 was a Sunday; fixed UTC dates keep server and browser output identical.
  const d = new Date(Date.UTC(2024, 0, 7 + day, 12));
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short", timeZone: "UTC" }).format(d);
  } catch {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
  }
}

function timeLabel(hhmm: string, locale: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(Date.UTC(2024, 0, 1, h, m));
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(d);
  } catch {
    return hhmm;
  }
}

/** Group sorted display positions into consecutive runs. */
function runs(positions: number[]): number[][] {
  const out: number[][] = [];
  for (const p of [...positions].sort((a, b) => a - b)) {
    const last = out[out.length - 1];
    if (last && p === last[last.length - 1] + 1) last.push(p);
    else out.push([p]);
  }
  return out;
}

function daysLabel(days: number[], locale: string): string {
  const positions = days.map((d) => ORDER.indexOf(d)).filter((p) => p >= 0);
  return runs(positions)
    .map((r) => {
      const first = dayName(ORDER[r[0]], locale);
      if (r.length === 1) return first;
      const last = dayName(ORDER[r[r.length - 1]], locale);
      return `${first} – ${last}`;
    })
    .join(locale === "ar" ? "، " : ", ");
}

export type HoursLine = { days: string; time: string };

/** One line per distinct shift group, ordered by first open day, plus a closed-days line. */
export function formatHoursLines(specs: SpecLike[] | undefined | null, locale = "en"): HoursLine[] {
  if (!Array.isArray(specs) || specs.length === 0) return [];
  const open = new Set<number>();
  const lines = specs
    .map((s) => {
      const days = (s.dayOfWeek || []).map((d) => DAY_INDEX[d]).filter((d) => d !== undefined);
      days.forEach((d) => open.add(d));
      return { days, opens: s.opens, closes: s.closes };
    })
    .filter((s) => s.days.length && s.opens && s.closes)
    .sort((a, b) => Math.min(...a.days.map((d) => ORDER.indexOf(d))) - Math.min(...b.days.map((d) => ORDER.indexOf(d))) || a.opens.localeCompare(b.opens))
    .map((s) => ({
      days: daysLabel(s.days, locale),
      time: `${timeLabel(s.opens, locale)} – ${timeLabel(s.closes, locale)}`,
    }));
  if (!lines.length) return [];
  const closed = ORDER.filter((d) => !open.has(d));
  if (closed.length) lines.push({ days: daysLabel(closed, locale), time: CLOSED[locale] || CLOSED.en });
  return lines;
}

export const HOURS_LOCALES = ["en", "es", "tl", "pa", "ar"] as const;

/** Pre-format every locale on the server so client markup never depends on browser ICU data. */
export function formatHoursByLocale(specs: SpecLike[] | undefined | null): Record<string, HoursLine[]> {
  return Object.fromEntries(HOURS_LOCALES.map((l) => [l, formatHoursLines(specs, l)]));
}
