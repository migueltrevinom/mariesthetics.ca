/**
 * Cookie payload for one visit. Kept small on purpose (browsers cap cookies near 4KB).
 * The server re-derives the channel; the cookie only stores what the browser saw.
 */

import {
  clip,
  deriveChannel,
  displayHost,
  isSelfHost,
  normalizeBlogLanguage,
  parseBlogLanding,
  type AttributionChannel,
} from "@/lib/attribution/channel";

export const FIRST_TOUCH_COOKIE = "mari_attr_ft";
export const LAST_TOUCH_COOKIE = "mari_attr_lt";
export const ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
const VISIT_FLAG = "mari_attr_visit";

export type AttributionTouch = {
  referrerHost: string;
  referrerUrl: string;
  landingPath: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  gclid: string;
  fbclid: string;
  msclkid: string;
  ttclid: string;
  ts: string;
  blogSlug: string;
  blogLanguage: string;
  channel: AttributionChannel;
};

const CAMPAIGN_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
  "ttclid",
] as const;

function emptyTouch(ts: string): AttributionTouch {
  return {
    referrerHost: "",
    referrerUrl: "",
    landingPath: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmTerm: "",
    utmContent: "",
    gclid: "",
    fbclid: "",
    msclkid: "",
    ttclid: "",
    ts,
    blogSlug: "",
    blogLanguage: "",
    channel: "Direct",
  };
}

export function referrerParts(referrer: string, pageHost?: string | null): { host: string; url: string } {
  const raw = clip(referrer, 2000);
  if (!raw) return { host: "", url: "" };
  try {
    const url = new URL(raw);
    const host = displayHost(url.hostname);
    if (!host || isSelfHost(host, pageHost)) return { host: "", url: "" };
    let stored = raw;
    if (stored.length > 800) {
      stored = `${url.origin}${url.pathname}`.slice(0, 800);
    }
    return { host: host.slice(0, 200), url: stored };
  } catch {
    return { host: "", url: "" };
  }
}

export function urlHasCampaign(pageUrl: string): boolean {
  try {
    const url = new URL(pageUrl);
    return CAMPAIGN_PARAMS.some((key) => (url.searchParams.get(key) || "").trim().length > 0);
  } catch {
    return false;
  }
}

/** First page of a visit: skip same-site hops unless this URL itself carries a campaign. */
export function planAttributionWrite(input: {
  hasExistingFirstTouch: boolean;
  referrerHost: string;
  hasCampaignSignal: boolean;
  pageHost?: string | null;
}): { writeFirst: boolean; writeLast: boolean } {
  if (isSelfHost(input.referrerHost, input.pageHost) && !input.hasCampaignSignal) {
    return { writeFirst: false, writeLast: false };
  }
  return {
    writeFirst: !input.hasExistingFirstTouch,
    writeLast: true,
  };
}

export function buildVisitTouch(args: {
  pageUrl: string;
  referrer?: string | null;
  blogLanguage?: string | null;
  now?: string;
  pageHost?: string | null;
}): AttributionTouch {
  const ts = args.now || new Date().toISOString();
  const touch = emptyTouch(ts);
  let pageHost = args.pageHost || "";
  let landingPath = "";
  let params: URLSearchParams | null = null;

  try {
    const url = new URL(args.pageUrl);
    pageHost = pageHost || url.hostname;
    landingPath = url.pathname.slice(0, 500);
    params = url.searchParams;
  } catch {
    landingPath = "";
  }

  const ref = referrerParts(args.referrer || "", pageHost);
  touch.referrerHost = ref.host;
  touch.referrerUrl = ref.url;
  touch.landingPath = landingPath;

  if (params) {
    touch.utmSource = clip(params.get("utm_source") || "", 200);
    touch.utmMedium = clip(params.get("utm_medium") || "", 200);
    touch.utmCampaign = clip(params.get("utm_campaign") || "", 200);
    touch.utmTerm = clip(params.get("utm_term") || "", 200);
    touch.utmContent = clip(params.get("utm_content") || "", 200);
    touch.gclid = clip(params.get("gclid") || "", 200);
    touch.fbclid = clip(params.get("fbclid") || "", 200);
    touch.msclkid = clip(params.get("msclkid") || "", 200);
    touch.ttclid = clip(params.get("ttclid") || "", 200);
  }

  const blog = parseBlogLanding(landingPath);
  touch.blogSlug = blog.slug;
  touch.blogLanguage = normalizeBlogLanguage(args.blogLanguage, blog.isBlogPost);
  touch.channel = deriveChannel({
    referrerUrl: touch.referrerUrl,
    referrerHost: touch.referrerHost,
    utmSource: touch.utmSource,
    utmMedium: touch.utmMedium,
    gclid: touch.gclid,
    fbclid: touch.fbclid,
    msclkid: touch.msclkid,
    ttclid: touch.ttclid,
    pageHost,
  });
  return touch;
}

export function touchHasSignal(touch: Partial<AttributionTouch> | null | undefined): boolean {
  if (!touch) return false;
  return Boolean(
    touch.referrerHost ||
      touch.referrerUrl ||
      touch.landingPath ||
      touch.utmSource ||
      touch.utmMedium ||
      touch.utmCampaign ||
      touch.utmTerm ||
      touch.utmContent ||
      touch.gclid ||
      touch.fbclid ||
      touch.msclkid ||
      touch.ttclid ||
      touch.blogSlug,
  );
}

/** Compact JSON, empty fields dropped, then percent-encoded for a cookie value. */
export function serializeTouch(touch: AttributionTouch): string {
  const compact: Record<string, string> = {};
  const entries: Array<[keyof AttributionTouch, string]> = [
    ["referrerHost", touch.referrerHost],
    ["referrerUrl", touch.referrerUrl],
    ["landingPath", touch.landingPath],
    ["utmSource", touch.utmSource],
    ["utmMedium", touch.utmMedium],
    ["utmCampaign", touch.utmCampaign],
    ["utmTerm", touch.utmTerm],
    ["utmContent", touch.utmContent],
    ["gclid", touch.gclid],
    ["fbclid", touch.fbclid],
    ["msclkid", touch.msclkid],
    ["ttclid", touch.ttclid],
    ["ts", touch.ts],
    ["blogSlug", touch.blogSlug],
    ["blogLanguage", touch.blogLanguage],
  ];
  for (const [key, value] of entries) {
    if (value) compact[key] = value;
  }
  return encodeURIComponent(JSON.stringify(compact));
}

export function parseTouch(raw: string | null | undefined): AttributionTouch | null {
  if (!raw || typeof raw !== "string") return null;
  const candidates = [raw];
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded !== raw) candidates.push(decoded);
  } catch {
    // already decoded, or not a URI component
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
      const touch = touchFromRecord(parsed as Record<string, unknown>);
      if (touchHasSignal(touch)) return touch;
    } catch {
      // try the next spelling
    }
  }
  return null;
}

export function touchFromRecord(record: Record<string, unknown>, pageHost?: string | null): AttributionTouch | null {
  const rawUrl = typeof record.referrerUrl === "string" ? record.referrerUrl : "";
  const ref = referrerParts(rawUrl, pageHost);
  const hostField = typeof record.referrerHost === "string" ? record.referrerHost : "";
  const host = isSelfHost(hostField, pageHost) ? ref.host : displayHost(hostField) || ref.host;
  const landingPath = clip(record.landingPath, 500);
  const blog = parseBlogLanding(landingPath);
  const touch: AttributionTouch = {
    referrerHost: isSelfHost(host, pageHost) ? "" : host.slice(0, 200),
    referrerUrl: ref.url,
    landingPath,
    utmSource: clip(record.utmSource, 200),
    utmMedium: clip(record.utmMedium, 200),
    utmCampaign: clip(record.utmCampaign, 200),
    utmTerm: clip(record.utmTerm, 200),
    utmContent: clip(record.utmContent, 200),
    gclid: clip(record.gclid, 200),
    fbclid: clip(record.fbclid, 200),
    msclkid: clip(record.msclkid, 200),
    ttclid: clip(record.ttclid, 200),
    ts: clip(record.ts, 40),
    blogSlug: blog.slug,
    blogLanguage: normalizeBlogLanguage(record.blogLanguage, blog.isBlogPost),
    channel: "Direct",
  };
  if (!touchHasSignal(touch)) return null;
  touch.channel = deriveChannel({ ...touch, pageHost });
  return touch;
}

export function readCookieValue(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(/;\s*/);
  for (const part of parts) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index) === name) return part.slice(index + 1);
  }
  return null;
}

export const attributionVisitFlag = VISIT_FLAG;
