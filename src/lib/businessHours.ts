import { connectDb } from "@/lib/db/connect";
import { CalendarSchedule } from "@/lib/db/models";

export type OpeningHoursSpec = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TTL_MS = 5 * 60 * 1000;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

let cache: { at: number; value: OpeningHoursSpec[] | undefined } | null = null;

/** Drop the cached hours (call after the admin schedule is saved). */
export function invalidateOpeningHoursCache() {
  cache = null;
}

type WeeklyRow = { dayOfWeek?: number; isOpen?: boolean; shifts?: Array<{ openTime?: string; closeTime?: string }> };

/** Pure mapping: weekly schedule rows -> schema.org specs, grouping days with identical shifts. */
export function weeklyHoursToSpec(rows: WeeklyRow[] | undefined | null): OpeningHoursSpec[] | undefined {
  if (!Array.isArray(rows) || rows.length === 0) return undefined;
  const groups = new Map<string, { opens: string; closes: string; days: number[] }>();
  for (const row of [...rows].sort((a, b) => Number(a.dayOfWeek) - Number(b.dayOfWeek))) {
    const day = Number(row.dayOfWeek);
    if (!row.isOpen || !Number.isInteger(day) || day < 0 || day > 6) continue;
    for (const s of row.shifts || []) {
      const opens = String(s.openTime || "");
      const closes = String(s.closeTime || "");
      if (!HHMM.test(opens) || !HHMM.test(closes) || opens >= closes) continue;
      const key = `${opens}-${closes}`;
      const g = groups.get(key) || { opens, closes, days: [] };
      if (!g.days.includes(day)) g.days.push(day);
      groups.set(key, g);
    }
  }
  const specs = [...groups.values()]
    .sort((a, b) => a.days[0] - b.days[0] || a.opens.localeCompare(b.opens))
    .map((g) => ({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: g.days.map((d) => DAY_NAMES[d]),
      opens: g.opens,
      closes: g.closes,
    }));
  return specs.length ? specs : undefined;
}

/**
 * Opening hours from the admin weekly schedule (CalendarSchedule), read-only and cached
 * in memory for 5 minutes. Returns undefined when no schedule exists — never invents hours.
 */
export async function getOpeningHoursSpec(): Promise<OpeningHoursSpec[] | undefined> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  try {
    await connectDb();
    const doc = await CalendarSchedule.findOne().select("weeklyHours").lean<{ weeklyHours?: WeeklyRow[] }>();
    const value = weeklyHoursToSpec(doc?.weeklyHours);
    cache = { at: Date.now(), value };
    return value;
  } catch {
    // Don't cache failures; omit hours this render.
    return cache?.value;
  }
}
