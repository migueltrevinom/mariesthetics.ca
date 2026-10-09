import Link from "next/link";
import type { BlogPromoConfig } from "@/lib/blog/types";

type Props = {
  promo: BlogPromoConfig;
  variant?: "inline" | "closing";
  bookLabel?: string;
};

export function BlogPromoCta({ promo, variant = "inline", bookLabel }: Props) {
  const ctaUrl = promo.ctaUrl?.trim() || "/book";
  const ctaText = promo.ctaButtonText?.trim() || bookLabel || "Book Treatment Now →";
  const showPromo = promo.enabled && (promo.customPromoText || promo.promoCode);
  const headline = showPromo && promo.customPromoText
    ? promo.customPromoText
    : "Book your private appointment at Mari Esthetics in West Edmonton.";

  const isClosing = variant === "closing";

  return (
    <aside
      className={
        isClosing
          ? "mt-16 rounded-2xl border border-[var(--line-strong)] bg-gradient-to-br from-[var(--forest)]/40 to-[var(--card-bg)] p-8 text-center md:p-10"
          : "my-10 rounded-2xl border border-[#c8a86b]/30 bg-[var(--card-bg)] p-6 md:p-8"
      }
    >
      <p className="eyebrow">{showPromo ? "Special offer" : "Ready for your glow?"}</p>

      <p className="mt-3 text-lg font-semibold text-[var(--ink)] md:text-xl">{headline}</p>

      {promo.enabled && promo.promoCode ? (
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          Use code{" "}
          <span className="rounded-md border border-[var(--line-strong)] bg-[var(--mist)] px-2 py-0.5 font-mono text-gold-bright">
            {promo.promoCode}
          </span>{" "}
          when you book online.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={ctaUrl} className="btn-primary">
          {ctaText}
        </Link>
        {!isClosing ? (
          <Link href="/services" className="btn-ghost">
            View services
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
