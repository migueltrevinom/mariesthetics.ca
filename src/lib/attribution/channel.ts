/**
 * Pure first-touch channel rules for mariesthetics.ca.
 * No I/O — safe to unit test and to run in the browser or on the server.
 */

export const ATTRIBUTION_CHANNELS = [
  "Google search",
  "Bing",
  "Other search",
  "Google Maps",
  "Instagram",
  "Facebook",
  "TikTok",
  "AI assistant",
  "Paid ads",
  "Email",
  "Referral",
  "Direct",
] as const;

export type AttributionChannel = (typeof ATTRIBUTION_CHANNELS)[number];

export const HEARD_ABOUT_OPTIONS = [
  "google_search",
  "google_maps",
  "ai_assistant",
  "instagram",
  "facebook",
  "tiktok",
  "friend_family",
  "pickleball",
  "walked_by",
] as const;

export type HeardAboutOption = (typeof HEARD_ABOUT_OPTIONS)[number];

/** English labels for the studio owner. The booking form translates these. */
export const HEARD_ABOUT_LABELS: Record<HeardAboutOption, string> = {
  google_search: "Google search",
  google_maps: "Google Maps",
  ai_assistant: "AI assistant (ChatGPT, Gemini, Grok, etc.)",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  friend_family: "Friend or family",
  pickleball: "Pickleball / met in person",
  walked_by: "Walked by / other",
};

const BLOG_LANGUAGES = new Set(["en", "es", "tl", "pa", "ar"]);

const PAID_MEDIUMS = new Set([
  "cpc",
  "ppc",
  "paid",
  "paidsocial",
  "paid_social",
  "cpm",
]);

const EMAIL_MEDIUMS = new Set(["email", "e-mail", "newsletter", "email_newsletter"]);
const EMAIL_SOURCES = new Set(["email", "e-mail", "newsletter", "mailchimp", "klaviyo"]);

const MAPS_SOURCES = new Set([
  "gbp",
  "gmb",
  "google_business",
  "google-business",
  "googlemybusiness",
]);

export type ChannelSignals = {
  referrerUrl?: string | null;
  referrerHost?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  ttclid?: string | null;
  /** Hostname of the page being viewed, so same-site referrers count as direct. */
  pageHost?: string | null;
};

export function clip(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

/** Hostname as seen, lowercased, for storage and display. */
export function displayHost(host: string | null | undefined): string {
  return clip(host, 200).toLowerCase().replace(/\.$/, "");
}

/** Comparison form: also drops a leading www. */
export function normalizeHost(host: string | null | undefined): string {
  return displayHost(host).replace(/^www\./, "");
}

/** mariesthetics.ca (any subdomain) or the page's own host. */
export function isSelfHost(host: string | null | undefined, pageHost?: string | null): boolean {
  const h = normalizeHost(host);
  if (!h) return false;
  if (h === "mariesthetics.ca" || h.endsWith(".mariesthetics.ca")) return true;
  const page = normalizeHost(pageHost);
  return Boolean(page) && h === page;
}

function hostFromUrl(raw: string): string {
  if (!raw) return "";
  try {
    return normalizeHost(new URL(raw).hostname);
  } catch {
    return "";
  }
}

function pathFromUrl(raw: string): string {
  if (!raw) return "";
  try {
    return new URL(raw).pathname || "";
  } catch {
    return "";
  }
}

function hostIs(host: string, root: string): boolean {
  const r = normalizeHost(root);
  return host === r || host.endsWith(`.${r}`);
}

function isGoogleHostname(host: string): boolean {
  return /^(www\.)?google\.([a-z]{2,3})(\.[a-z]{2})?$/.test(host) || /^google\.([a-z]{2,3})(\.[a-z]{2})?$/.test(host);
}

function isGoogleSearchHost(host: string): boolean {
  if (!host || host.startsWith("gemini.") || host === "maps.google.com" || host.endsWith(".maps.google.com")) {
    return false;
  }
  return isGoogleHostname(host);
}

function isGoogleMaps(host: string, path: string, utmSource: string): boolean {
  if (MAPS_SOURCES.has(utmSource)) return true;
  if (host === "maps.google.com" || host.endsWith(".maps.google.com") || host.startsWith("maps.google.")) {
    return true;
  }
  const mapsPath = path === "/maps" || path.startsWith("/maps/");
  return mapsPath && (isGoogleHostname(host) || host.startsWith("maps."));
}

function isPaidMedium(medium: string): boolean {
  if (!medium) return false;
  return PAID_MEDIUMS.has(medium) || medium.startsWith("paid");
}

function isPaidHost(host: string): boolean {
  return (
    hostIs(host, "googleadservices.com") ||
    hostIs(host, "doubleclick.net") ||
    hostIs(host, "googlesyndication.com")
  );
}

function isEmail(source: string, medium: string): boolean {
  return EMAIL_MEDIUMS.has(medium) || EMAIL_SOURCES.has(source);
}

const AI_SOURCES = new Set([
  "chatgpt",
  "chatgpt.com",
  "openai",
  "chat.openai.com",
  "perplexity",
  "perplexity.ai",
  "gemini",
  "gemini.google.com",
  "copilot",
  "copilot.microsoft.com",
  "grok",
  "grok.com",
  "claude",
  "claude.ai",
  "meta.ai",
]);

function isGrokOnX(host: string, path: string): boolean {
  const onX = host === "x.com" || host.endsWith(".x.com");
  if (!onX) return false;
  const normalized = path.toLowerCase().replace(/\/+$/, "") || "/";
  return normalized === "/i/grok" || normalized.startsWith("/i/grok/");
}

function isAi(host: string, path: string, source: string): boolean {
  if (AI_SOURCES.has(source)) return true;
  if (hostIs(host, "chatgpt.com") || hostIs(host, "chat.openai.com")) return true;
  if (hostIs(host, "perplexity.ai")) return true;
  if (hostIs(host, "grok.com") || hostIs(host, "claude.ai") || hostIs(host, "meta.ai")) return true;
  if (host === "gemini.google.com" || host.endsWith(".gemini.google.com")) return true;
  if (isGrokOnX(host, path)) return true;
  if (
    host === "copilot.microsoft.com" ||
    host.endsWith(".copilot.microsoft.com") ||
    host === "copilot.cloud.microsoft.com" ||
    hostIs(host, "copilot.com")
  ) {
    return true;
  }
  if (hostIs(host, "bing.com") && (path === "/chat" || path.startsWith("/chat/"))) return true;
  return false;
}

/**
 * Channel stored on the booking and used for the admin counts.
 * A self-reported AI answer uses the same "AI assistant" name as an AI referrer,
 * so those bookings add up in one row. The answer itself stays on heardAbout.
 */
export function channelForBooking(derivedChannel: string, heardAbout: string): string {
  if (heardAbout === "ai_assistant") return "AI assistant";
  return derivedChannel;
}

function isInstagram(host: string, source: string): boolean {
  return ["instagram", "ig", "insta"].includes(source) || hostIs(host, "instagram.com");
}

function isFacebook(host: string, source: string): boolean {
  return (
    ["facebook", "fb"].includes(source) ||
    hostIs(host, "facebook.com") ||
    hostIs(host, "fb.com") ||
    host === "fb.me" ||
    host.endsWith(".fb.me")
  );
}

function isTikTok(host: string, source: string): boolean {
  return ["tiktok", "tik_tok"].includes(source) || hostIs(host, "tiktok.com");
}

function isBing(host: string, source: string): boolean {
  return source === "bing" || hostIs(host, "bing.com");
}

function isOtherSearch(host: string, source: string): boolean {
  if (["duckduckgo", "ddg", "brave", "yahoo", "ecosia"].includes(source)) return true;
  if (hostIs(host, "duckduckgo.com")) return true;
  if (host === "search.brave.com" || host.endsWith(".search.brave.com")) return true;
  if (hostIs(host, "ecosia.org")) return true;
  if ((host === "yahoo.com" || host.endsWith(".yahoo.com")) && host !== "mail.yahoo.com" && !host.endsWith(".mail.yahoo.com")) {
    return true;
  }
  return false;
}

/**
 * Readable channel for the studio owner.
 * Google Maps / Business Profile is checked before paid clicks so a
 * utm_source=gbp visit stays "Google Maps" (the click id is still stored).
 * Any other click id or cpc/paid medium is "Paid ads".
 */
export function deriveChannel(input: ChannelSignals): AttributionChannel {
  const referrerUrl = clip(input.referrerUrl, 2000);
  let host = normalizeHost(input.referrerHost) || hostFromUrl(referrerUrl);
  let path = pathFromUrl(referrerUrl);
  if (isSelfHost(host, input.pageHost)) {
    host = "";
    path = "";
  }

  const source = clip(input.utmSource, 200).toLowerCase();
  const medium = clip(input.utmMedium, 200).toLowerCase();
  const hasClick = Boolean(
    clip(input.gclid, 300) || clip(input.fbclid, 300) || clip(input.msclkid, 300) || clip(input.ttclid, 300),
  );

  if (isGoogleMaps(host, path, source)) return "Google Maps";
  if (hasClick || isPaidMedium(medium) || isPaidHost(host)) return "Paid ads";
  if (isEmail(source, medium)) return "Email";
  if (isAi(host, path, source)) return "AI assistant";
  if (isInstagram(host, source)) return "Instagram";
  if (isFacebook(host, source)) return "Facebook";
  if (isTikTok(host, source)) return "TikTok";
  if (isGoogleSearchHost(host) || source === "google") return "Google search";
  if (isBing(host, source)) return "Bing";
  if (isOtherSearch(host, source)) return "Other search";
  if (host) return "Referral";
  return "Direct";
}

export function parseBlogLanding(landingPath: string | null | undefined): { isBlogPost: boolean; slug: string } {
  if (!landingPath || typeof landingPath !== "string") return { isBlogPost: false, slug: "" };
  let path = landingPath.split("?")[0]?.split("#")[0] || "";
  for (let i = 0; i < 3; i += 1) {
    if (!/%[0-9A-Fa-f]{2}/.test(path)) break;
    try {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
    } catch {
      break;
    }
  }
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  const parts = path.split("/").filter(Boolean);
  if (parts[0]?.toLowerCase() !== "blog" || !parts[1]) {
    return { isBlogPost: false, slug: "" };
  }
  const slug = parts[1].normalize("NFKC").toLowerCase().slice(0, 300);
  return { isBlogPost: Boolean(slug), slug };
}

export function normalizeBlogLanguage(value: unknown, isBlogPost: boolean): string {
  if (!isBlogPost) return "";
  const lang = clip(value, 12).toLowerCase();
  return BLOG_LANGUAGES.has(lang) ? lang : "";
}

export function heardAboutLabel(value: string | null | undefined): string {
  if (!value) return "";
  if ((HEARD_ABOUT_OPTIONS as readonly string[]).includes(value)) {
    return HEARD_ABOUT_LABELS[value as HeardAboutOption];
  }
  return "";
}

export function adClickNetwork(input: {
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  ttclid?: string | null;
}): string {
  if (clip(input.gclid, 20)) return "Google ad click";
  if (clip(input.msclkid, 20)) return "Microsoft ad click";
  if (clip(input.fbclid, 20)) return "Meta ad click";
  if (clip(input.ttclid, 20)) return "TikTok ad click";
  return "";
}
