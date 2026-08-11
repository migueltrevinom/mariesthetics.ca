"use client";

import Image from "next/image";
import Link from "next/link";
import { business } from "@/lib/seo";
import { useLanguage } from "@/components/i18n/LanguageContext";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[var(--background)] transition-colors duration-200">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=2000&q=80"
          alt="Calm esthetics treatment room at Mari Esthetics in Edmonton"
          fill
          priority
          fetchPriority="high"
          decoding="async"
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      {/* Cinematic overlays */}
      <div className="absolute inset-0 transition-all duration-300" style={{ backgroundImage: "var(--hero-overlay-linear)" }} />
      <div className="absolute inset-0 transition-all duration-300" style={{ backgroundImage: "var(--hero-overlay-radial)" }} />
      <div className="grain absolute inset-0" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-24 pt-40 md:px-10 md:pb-32">
        <p className="reveal eyebrow font-bold tracking-[0.28em] text-[#856526] dark:text-[#c8a86b] drop-shadow-md">{t("hero.eyebrow")}</p>
        <h1 className="reveal reveal-delay-1 display mt-6 max-w-4xl text-[3.4rem] leading-[0.95] text-[var(--ink)] sm:text-7xl md:text-[6.5rem]">
          {t("hero.title1")}
          <br />
          <span className="gold-text italic">{t("hero.title2")}</span>
        </h1>
        <p className="reveal reveal-delay-2 mt-8 max-w-xl text-lg leading-relaxed text-ink-soft">
          {t("hero.subtitle")}
        </p>
        <div className="reveal reveal-delay-3 mt-10 flex flex-wrap gap-4 items-center">
          <Link href="/book" className="btn-primary">
            {t("hero.ctaBook")}
          </Link>
          <Link href="/services" className="btn-ghost">
            {t("hero.ctaServices")}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[var(--ink-faint)] md:flex">
        <span className="text-[0.65rem] uppercase tracking-[0.3em]">Scroll</span>
        <span className="scrollcue h-8 w-px bg-[var(--gold)]" />
      </div>
    </section>
  );
}
