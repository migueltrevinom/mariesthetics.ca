import Link from "next/link";
import type { Locale } from "@/components/i18n/LanguageContext";
import type { BlogServiceRef } from "@/lib/blog/types";
import { SERVICE_LANDING_PAGES } from "@/lib/services/landing/registry";
import { landingSlugForLocale } from "@/lib/services/landing/resolve";
import { serviceLandingPath } from "@/lib/services/landing/paths";

const LASH_TERMS = /\b(lash|lashes|eyelash|extensiones de pesta|pesta[ñn]as|pilikmata)|ਲੈਸ਼|رموش|الرموش/i;

const COPY: Record<Locale, { eyebrow: string; anchor: string; cta: string }> = {
  en: { eyebrow: "Treatment guide", anchor: "Lash extensions in West Edmonton: prices, fills & booking", cta: "Read the guide →" },
  es: { eyebrow: "Guía del tratamiento", anchor: "Extensiones de pestañas en el oeste de Edmonton: precios, rellenos y reservas", cta: "Ver la guía →" },
  tl: { eyebrow: "Gabay sa treatment", anchor: "Lash extensions sa West Edmonton: presyo, fills at booking", cta: "Basahin ang gabay →" },
  pa: { eyebrow: "ਟ੍ਰੀਟਮੈਂਟ ਗਾਈਡ", anchor: "ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ: ਕੀਮਤਾਂ, ਫਿੱਲ ਅਤੇ ਬੁਕਿੰਗ", cta: "ਗਾਈਡ ਪੜ੍ਹੋ →" },
  ar: { eyebrow: "دليل العلاج", anchor: "وصلات الرموش في غرب إدمونتون: الأسعار والتعبئة والحجز", cta: "اقرأ الدليل →" },
};

/** True when a post is about lashes: linked lash service, lash category, or lash terms in title/slug/category. */
export function isLashPost(post: { title: string; slug: string; category?: string; serviceIds?: BlogServiceRef[] }): boolean {
  if (post.serviceIds?.some((s) => s.category === "lashes")) return true;
  return LASH_TERMS.test(`${post.category || ""} ${post.title} ${decodeURIComponent(post.slug).replace(/-/g, " ")}`);
}

/** Always-on link from lash posts to the lash service guide in the post's language. */
export function BlogLashGuideLink({ language }: { language: Locale }) {
  const def = SERVICE_LANDING_PAGES.find((d) => d.key === "lash-extensions");
  if (!def) return null;
  const c = COPY[language] || COPY.en;
  return (
    <section className="mt-10 rounded-2xl border border-gold/40 bg-[var(--card-bg)] p-5">
      <p className="eyebrow">{c.eyebrow}</p>
      <Link href={serviceLandingPath(landingSlugForLocale(def, language))} className="mt-2 block font-semibold text-[var(--ink)] hover:text-gold">
        {c.anchor}
      </Link>
      <span className="mt-1 block text-xs text-[var(--ink-soft)]">{c.cta}</span>
    </section>
  );
}
