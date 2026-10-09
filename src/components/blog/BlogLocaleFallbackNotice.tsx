"use client";

import { useLanguage, LANGUAGES } from "@/components/i18n/LanguageContext";
import type { BlogLanguage } from "@/lib/blog/types";

export function BlogLocaleFallbackNotice({ postLanguage }: { postLanguage: BlogLanguage }) {
  const { locale, t } = useLanguage();

  if (locale === postLanguage) return null;

  const langLabel =
    LANGUAGES.find((l) => l.code === locale)?.label || locale.toUpperCase();

  const template =
    t("blog.localeFallback") !== "blog.localeFallback"
      ? t("blog.localeFallback")
      : "This article is not yet available in {language}. Showing the English version.";

  const message = template.replace("{language}", langLabel);

  return (
    <div
      className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--ink-soft)]"
      role="status"
    >
      {message}
    </div>
  );
}
