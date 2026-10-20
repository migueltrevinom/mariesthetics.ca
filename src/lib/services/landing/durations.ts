import type { Locale } from "@/components/i18n/LanguageContext";
import type { LandingContent } from "./types";

/**
 * Service guide copy never hardcodes appointment lengths. Strings may contain
 * {duration} (all services on the page), {setDuration} (non-fill services) or
 * {fillDuration} (fills), which are filled from live DB durations at render.
 */
type DurationRow = { name: string; durationMin: number };

const MINUTES: Record<Locale, string> = {
  en: "minutes",
  es: "minutos",
  tl: "minuto",
  pa: "ਮਿੰਟ",
  ar: "دقيقة",
};

const FILL = /\b(fill|fills|refill|refills|relleno)\b/i;

export function formatDurationRange(mins: number[], locale: Locale): string {
  const valid = mins.filter((m) => Number.isFinite(m) && m > 0);
  if (!valid.length) return "";
  const lo = Math.min(...valid);
  const hi = Math.max(...valid);
  const word = MINUTES[locale] ?? MINUTES.en;
  return lo === hi ? `${lo} ${word}` : `${lo}–${hi} ${word}`;
}

function fillTokens(text: string, tokens: Record<string, string>): string | null {
  let missing = false;
  const out = text.replace(/\{(duration|setDuration|fillDuration)\}/g, (_m, key: string) => {
    const v = tokens[key];
    if (!v) missing = true;
    return v || "";
  });
  return missing ? null : out;
}

/** Replace duration tokens with live values; drop list items whose token has no data. */
export function applyLandingDurations(
  content: LandingContent,
  services: DurationRow[],
  locale: Locale
): LandingContent {
  const tokens: Record<string, string> = {
    duration: formatDurationRange(services.map((s) => s.durationMin), locale),
    setDuration: formatDurationRange(services.filter((s) => !FILL.test(s.name)).map((s) => s.durationMin), locale),
    fillDuration: formatDurationRange(services.filter((s) => FILL.test(s.name)).map((s) => s.durationMin), locale),
  };
  const list = (items: string[]) =>
    items.map((t) => fillTokens(t, tokens)).filter((t): t is string => t !== null && t.trim() !== "");
  const one = (t: string) => fillTokens(t, tokens) ?? t.replace(/\{(duration|setDuration|fillDuration)\}/g, "").replace(/\s{2,}/g, " ");
  return {
    ...content,
    metaDescription: one(content.metaDescription),
    intro: list(content.intro),
    whatToExpect: list(content.whatToExpect),
    aftercare: list(content.aftercare),
    faqs: content.faqs
      .map((f) => {
        const q = fillTokens(f.q, tokens);
        const a = fillTokens(f.a, tokens);
        return q !== null && a !== null ? { q, a } : null;
      })
      .filter((f): f is { q: string; a: string } => f !== null),
  };
}
