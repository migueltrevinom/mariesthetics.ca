"use client";

import { useEffect } from "react";
import { captureAttributionOnce } from "@/lib/attribution/browser";

/** Records the landing of this visit. Renders nothing and never throws into the page. */
export function AttributionCapture() {
  useEffect(() => {
    try {
      captureAttributionOnce();
    } catch {
      // A tracking failure must not affect browsing or booking.
    }
  }, []);

  return null;
}
