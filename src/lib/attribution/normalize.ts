import {
  HEARD_ABOUT_OPTIONS,
  adClickNetwork,
  clip,
  heardAboutLabel,
  type HeardAboutOption,
} from "@/lib/attribution/channel";
import {
  parseTouch,
  touchFromRecord,
  touchHasSignal,
  type AttributionTouch,
} from "@/lib/attribution/touch";

export type StoredSource = {
  channel: string;
  heardAbout: string;
  heardAboutDetail: string;
  landingPath: string;
  referrerHost: string;
  referrerUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  blogSlug: string;
  blogLanguage: string;
  adClick: string;
  firstTouch?: AttributionTouch;
  lastTouch?: AttributionTouch;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readTouch(value: unknown): AttributionTouch | null {
  if (typeof value === "string") return parseTouch(value);
  const record = asRecord(value);
  if (!record) return null;
  return touchFromRecord(record);
}

function normalizeHeardAbout(value: unknown): string {
  const raw = clip(value, 40);
  return (HEARD_ABOUT_OPTIONS as readonly string[]).includes(raw) ? raw : "";
}

/**
 * Turn the booking payload (and optional cookie fallbacks) into the source
 * subdocument. Returns null when there is nothing worth storing.
 * Never throws — callers can ignore a null and still create the booking.
 */
export function resolveBookingSource(
  bodySource: unknown,
  cookieFirst?: string | null,
  cookieLast?: string | null,
): StoredSource | null {
  try {
    const body = asRecord(bodySource);
    if (!body) return null;

    const first = readTouch(body.firstTouch) || parseTouch(cookieFirst);
    const last = readTouch(body.lastTouch) || parseTouch(cookieLast);
    const heardAbout = normalizeHeardAbout(body.heardAbout);
    const heardAboutDetail = clip(body.heardAboutDetail, 300);

    if (!first && !last && !heardAbout && !heardAboutDetail) return null;

    const primary = (first && touchHasSignal(first) ? first : null) || last;
    const adClick = adClickNetwork(primary || {});

    return {
      channel: primary?.channel || "",
      heardAbout,
      heardAboutDetail,
      landingPath: primary?.landingPath || "",
      referrerHost: primary?.referrerHost || "",
      referrerUrl: primary?.referrerUrl || "",
      utmSource: primary?.utmSource || "",
      utmMedium: primary?.utmMedium || "",
      utmCampaign: primary?.utmCampaign || "",
      utmTerm: primary?.utmTerm || "",
      utmContent: primary?.utmContent || "",
      blogSlug: primary?.blogSlug || "",
      blogLanguage: primary?.blogLanguage || "",
      adClick,
      ...(first ? { firstTouch: first } : {}),
      ...(last ? { lastTouch: last } : {}),
    };
  } catch {
    return null;
  }
}

export function sourceHasSignal(source: StoredSource | null | undefined): boolean {
  if (!source) return false;
  return Boolean(
    source.channel ||
      source.heardAbout ||
      source.heardAboutDetail ||
      source.landingPath ||
      source.referrerHost ||
      source.utmSource,
  );
}

export function formatHeardAbout(source: { heardAbout?: string | null; heardAboutDetail?: string | null }): string {
  const label = heardAboutLabel(source.heardAbout);
  const detail = clip(source.heardAboutDetail, 300);
  if (label && detail) return `${label} — ${detail}`;
  return label || detail;
}

export type { HeardAboutOption };
