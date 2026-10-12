"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { SERVICE_LANDING_PAGES } from "@/lib/services/landing/registry";
import { landingSlugForLocale } from "@/lib/services/landing/resolve";
import { serviceLandingPath } from "@/lib/services/landing/paths";
import { LANDING_CHIP_LABELS } from "@/lib/services/landing/quickLabels";

export function ServiceLandingQuickLinks() {
  const { locale } = useLanguage();

  return (
    <div className="reveal reveal-delay-3 mt-8 flex flex-wrap gap-2.5">
      {SERVICE_LANDING_PAGES.map((def) => {
        const slug = landingSlugForLocale(def, locale);
        const label = LANDING_CHIP_LABELS[def.key][locale] || LANDING_CHIP_LABELS[def.key].en;
        return (
          <Link
            key={def.key}
            href={serviceLandingPath(slug)}
            className="chip font-medium shadow-sm hover:scale-105 transition-all"
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
