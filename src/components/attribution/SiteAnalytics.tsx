"use client";

import { Analytics } from "@vercel/analytics/next";

/** Vercel Web Analytics. Admin browsing is left out so it doesn't mix with client traffic. */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          return event.url.includes("/admin") ? null : event;
        } catch {
          return event;
        }
      }}
    />
  );
}
