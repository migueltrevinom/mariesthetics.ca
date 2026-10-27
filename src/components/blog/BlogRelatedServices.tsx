import Link from "next/link";
import { formatCad } from "@/lib/money";
import type { BlogServiceRef } from "@/lib/blog/types";
import type { Locale } from "@/components/i18n/LanguageContext";
import { landingDefinitionForService, landingSlugForLocale } from "@/lib/services/landing/resolve";
import { serviceLandingPath } from "@/lib/services/landing/paths";

const HEADINGS: Record<Locale, { related: string; guide: string }> = {
  en: { related: "Related treatments", guide: "Read the guide" },
  es: { related: "Tratamientos relacionados", guide: "Ver la guía" },
  tl: { related: "Mga kaugnay na treatment", guide: "Basahin ang gabay" },
  pa: { related: "ਸੰਬੰਧਿਤ ਟ੍ਰੀਟਮੈਂਟ", guide: "ਗਾਈਡ ਪੜ੍ਹੋ" },
  ar: { related: "علاجات ذات صلة", guide: "اقرأ الدليل" },
};

/** Guide-page path for a service in the given language, or null if it has no guide. */
export function serviceGuidePath(svc: BlogServiceRef, language: Locale): string | null {
  const def = landingDefinitionForService({
    category: svc.category || "",
    slug: svc.slug || "",
    name: svc.name,
    _id: svc._id,
  });
  return def ? serviceLandingPath(landingSlugForLocale(def, language)) : null;
}

export function BlogRelatedServices({
  services,
  language = "en",
}: {
  services: BlogServiceRef[];
  language?: Locale;
}) {
  if (!services.length) return null;
  const copy = HEADINGS[language] ?? HEADINGS.en;

  return (
    <section className="mt-14 border-t border-[var(--border-color)] pt-10">
      <p className="eyebrow">{copy.related}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {services.map((svc) => {
          const guide = serviceGuidePath(svc, language);
          return (
            <li key={svc._id}>
              <Link
                href={guide ?? (svc.slug ? `/services#${svc.slug}` : "/services")}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-3 text-sm transition-colors hover:border-gold hover:text-gold-bright"
              >
                <span>
                  <span className="block font-semibold text-[var(--ink)]">{svc.name}</span>
                  {guide ? <span className="block text-xs text-[var(--ink-soft)]">{copy.guide} →</span> : null}
                </span>
                {svc.priceCents != null ? (
                  <span className="text-[var(--ink-soft)]">{formatCad(svc.priceCents)}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
