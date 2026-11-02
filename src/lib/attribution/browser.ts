"use client";

import {
  FIRST_TOUCH_COOKIE,
  LAST_TOUCH_COOKIE,
  ATTRIBUTION_MAX_AGE_SECONDS,
  attributionVisitFlag,
  buildVisitTouch,
  parseTouch,
  planAttributionWrite,
  readCookieValue,
  serializeTouch,
  urlHasCampaign,
  type AttributionTouch,
} from "@/lib/attribution/touch";

function readCookie(name: string): string | null {
  try {
    return readCookieValue(document.cookie || "", name);
  } catch {
    return null;
  }
}

function writeCookie(name: string, touch: AttributionTouch): void {
  let value = serializeTouch(touch);
  if (value.length > 3500) {
    value = serializeTouch({ ...touch, referrerUrl: "" });
  }
  if (!value || value.length > 3800) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=${ATTRIBUTION_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function blogLanguageFromDom(pathname: string): string {
  if (!pathname.startsWith("/blog/")) return "";
  try {
    return document.querySelector("article[lang]")?.getAttribute("lang") || "";
  } catch {
    return "";
  }
}

/**
 * Record this visit once. First-touch cookie is left alone when it already
 * exists. Same-site referrers (mariesthetics.ca, or this host) are ignored
 * unless the landing URL has campaign parameters.
 */
export function captureAttributionOnce(): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname || "/";
  if (path === "/admin" || path.startsWith("/admin/")) return;

  try {
    if (window.sessionStorage.getItem(attributionVisitFlag) === "1") return;
    window.sessionStorage.setItem(attributionVisitFlag, "1");
  } catch {
    // Private mode can block sessionStorage. The first-touch cookie still wins.
  }

  const pageUrl = window.location.href;
  const referrer = document.referrer || "";
  let referrerHost = "";
  try {
    if (referrer) referrerHost = new URL(referrer).hostname;
  } catch {
    referrerHost = "";
  }

  const existingFirst = parseTouch(readCookie(FIRST_TOUCH_COOKIE));
  const plan = planAttributionWrite({
    hasExistingFirstTouch: Boolean(existingFirst),
    referrerHost,
    hasCampaignSignal: urlHasCampaign(pageUrl),
    pageHost: window.location.hostname,
  });
  if (!plan.writeFirst && !plan.writeLast) return;

  const touch = buildVisitTouch({
    pageUrl,
    referrer,
    blogLanguage: blogLanguageFromDom(path),
    pageHost: window.location.hostname,
  });

  if (plan.writeFirst) writeCookie(FIRST_TOUCH_COOKIE, touch);
  if (plan.writeLast) writeCookie(LAST_TOUCH_COOKIE, touch);
}

export function readAttributionForBooking(answer: {
  heardAbout?: string;
  heardAboutDetail?: string;
}): {
  heardAbout: string;
  heardAboutDetail: string;
  firstTouch: AttributionTouch | null;
  lastTouch: AttributionTouch | null;
} {
  return {
    heardAbout: answer.heardAbout || "",
    heardAboutDetail: answer.heardAboutDetail || "",
    firstTouch: parseTouch(readCookie(FIRST_TOUCH_COOKIE)),
    lastTouch: parseTouch(readCookie(LAST_TOUCH_COOKIE)),
  };
}
