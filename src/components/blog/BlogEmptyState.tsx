"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageContext";

export function BlogEmptyState() {
  const { t } = useLanguage();

  const title =
    t("blog.emptyTitle") !== "blog.emptyTitle"
      ? t("blog.emptyTitle")
      : "Articles coming soon";
  const subtitle =
    t("blog.emptySubtitle") !== "blog.emptySubtitle"
      ? t("blog.emptySubtitle")
      : "We are preparing skin care tips and studio updates. In the meantime, explore our treatment menu or book your visit.";
  const book =
    t("nav.book") !== "nav.book" ? t("nav.book") : "Book Appointment";

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-10 text-center">
      <p className="eyebrow">Blog</p>
      <h2 className="mt-4 text-2xl font-semibold text-[var(--ink)]">{title}</h2>
      <p className="mt-4 text-sm leading-relaxed text-[var(--ink-soft)]">{subtitle}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/book" className="btn-primary">{book}</Link>
        <Link href="/services" className="btn-ghost">Services</Link>
      </div>
    </div>
  );
}
