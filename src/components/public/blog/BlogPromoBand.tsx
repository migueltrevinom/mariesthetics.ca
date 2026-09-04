import Link from "next/link";

export function BlogPromoBand({
  promoCode,
  customPromoText,
  ctaButtonText,
  ctaUrl,
}: {
  promoCode?: string;
  customPromoText?: string;
  ctaButtonText?: string;
  ctaUrl?: string;
}) {
  return (
    <aside className="mt-12 rounded-3xl border border-[#c8a86b]/40 bg-[#c8a86b]/10 p-7 md:p-9">
      <p className="eyebrow text-[#c8a86b]">West Edmonton studio</p>
      <h2 className="font-[family-name:var(--font-display)] mt-3 text-2xl md:text-3xl text-[var(--ink)]">
        Book a private lash appointment
      </h2>
      {customPromoText ? (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--ink-soft)]">
          {customPromoText}
        </p>
      ) : (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--ink-soft)]">
          Reserve a set or fill at Mari Esthetics in Glastonbury — quiet, one-on-one, by appointment.
        </p>
      )}
      {promoCode ? (
        <p className="mt-4 text-xs font-mono font-bold uppercase tracking-wider text-[#c8a86b]">
          Code: {promoCode}
        </p>
      ) : null}
      <Link href={ctaUrl || "/book"} className="btn-primary mt-6 inline-flex">
        {ctaButtonText || "Book Treatment Now →"}
      </Link>
    </aside>
  );
}
