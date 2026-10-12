"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { ResolvedBlogPromo } from "@/lib/blog/types";

type Props = {
  promo: ResolvedBlogPromo;
  variant?: "inline" | "closing";
};

export function BlogPromoCta({ promo, variant = "inline" }: Props) {
  const { t } = useLanguage();

  const eyebrowOffer =
    t("blog.promo.eyebrowOffer") !== "blog.promo.eyebrowOffer"
      ? t("blog.promo.eyebrowOffer")
      : "Special offer";
  const eyebrowBooking =
    t("blog.promo.eyebrowBooking") !== "blog.promo.eyebrowBooking"
      ? t("blog.promo.eyebrowBooking")
      : "Ready for your glow?";
  const useCodePrefix =
    t("blog.promo.useCode") !== "blog.promo.useCode"
      ? t("blog.promo.useCode")
      : "Use code";
  const bookOnline =
    t("blog.promo.bookOnline") !== "blog.promo.bookOnline"
      ? t("blog.promo.bookOnline")
      : "when you book online.";
  const viewServices =
    t("nav.services") !== "nav.services" ? t("nav.services") : "View services";

  const isClosing = variant === "closing";
  const showOfferEyebrow = promo.hasValidCoupon;

  return (
    <aside
      className={
        isClosing
          ? "mt-16 rounded-2xl border border-[var(--line-strong)] bg-gradient-to-br from-[var(--forest)]/40 to-[var(--card-bg)] p-8 text-center md:p-10"
          : "my-10 rounded-2xl border border-[#c8a86b]/30 bg-[var(--card-bg)] p-6 md:p-8"
      }
    >
      <p className="eyebrow">{showOfferEyebrow ? eyebrowOffer : eyebrowBooking}</p>

      <p className="mt-3 text-lg font-semibold text-[var(--ink)] md:text-xl">{promo.headline}</p>

      {promo.hasValidCoupon && promo.code ? (
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          {useCodePrefix}{" "}
          <span className="rounded-md border border-[var(--line-strong)] bg-[var(--mist)] px-2 py-0.5 font-mono text-gold-bright">
            {promo.code}
          </span>
          {promo.discountLabel ? (
            <span className="ml-1 text-[var(--ink)]">({promo.discountLabel})</span>
          ) : null}{" "}
          {bookOnline}
        </p>
      ) : null}

      {promo.hasValidCoupon && promo.expiryLabel ? (
        <p className="mt-2 text-xs text-[var(--ink-soft)]">{promo.expiryLabel}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={promo.ctaUrl} className="btn-primary">
          {promo.ctaButtonText}
        </Link>
        {!isClosing ? (
          <Link href="/services" className="btn-ghost">
            {viewServices}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
