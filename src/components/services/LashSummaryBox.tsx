import Link from "next/link";
import type { Locale } from "@/components/i18n/LanguageContext";
import { formatCad } from "@/lib/money";
import { LASH_COPY, lashRanges, type LashSummary } from "@/lib/services/landing/lashSummary";

/** Server-rendered quick-facts box; every number comes from live service rows. */
export function LashSummaryBox({ summary, locale }: { summary: LashSummary; locale: Locale }) {
  const c = LASH_COPY[locale] || LASH_COPY.en;
  const r = lashRanges(summary, locale);
  const bookTarget = summary.minSet!;
  return (
    <aside className="mt-6 rounded-2xl border border-gold/40 bg-[var(--card-bg)] p-5 text-sm" aria-label={c.heading}>
      <p className="eyebrow">{c.heading}</p>
      <table className="mt-3 w-full text-start">
        <thead className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
          <tr>
            <th className="py-1 text-start font-semibold" />
            <th className="py-1 text-start font-semibold">{c.fullSet}</th>
            <th className="py-1 text-start font-semibold">{c.fill}</th>
          </tr>
        </thead>
        <tbody>
          {summary.lines.map((l) => (
            <tr key={l.type} className="border-t border-[var(--border-color)]">
              <td className="py-2 font-medium text-[var(--ink)]">{c.type[l.type]}</td>
              <td className="py-2 text-[var(--ink)]">
                <Link href={`/book?serviceId=${l.set!._id}`} className="hover:text-gold">{formatCad(l.set!.priceCents)}</Link>
              </td>
              <td className="py-2 text-[var(--ink-soft)]">
                {l.fill ? <Link href={`/book?serviceId=${l.fill._id}`} className="hover:text-gold">{formatCad(l.fill.priceCents)}</Link> : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[var(--ink-soft)]">{c.fillRule}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        {r.length ? (<div><dt className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">{c.length}</dt><dd className="text-[var(--ink)]">{r.length}</dd></div>) : null}
        {r.deposit ? (<div><dt className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">{c.deposit}</dt><dd className="text-[var(--ink)]">{r.deposit} <span className="text-xs text-[var(--ink-soft)]">({c.credited})</span></dd></div>) : null}
      </dl>
      <Link href={`/book?serviceId=${bookTarget._id}`} className="btn-primary mt-4 inline-block text-xs !px-6 !py-3">
        {c.book(c.type[summary.lines.find((l) => l.set === bookTarget)!.type])}
      </Link>
    </aside>
  );
}
