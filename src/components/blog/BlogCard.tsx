"use client";

import Link from "next/link";
import { formatBlogDate } from "@/components/blog/formatBlogDate";
import { useLanguage, LANGUAGES } from "@/components/i18n/LanguageContext";
import type { BlogListItem } from "@/lib/blog/types";
import { blogPostPath } from "@/lib/blog/slug";

export function BlogCard({ post }: { post: BlogListItem }) {
  const { locale, t } = useLanguage();
  const dateLabel = formatBlogDate(post.publishedAt);
  const showFallback = post.localeFallback && locale !== post.language;
  const langLabel =
    LANGUAGES.find((l) => l.code === locale)?.label || locale.toUpperCase();
  const fallbackNote =
    t("blog.cardLocaleFallback") !== "blog.cardLocaleFallback"
      ? t("blog.cardLocaleFallback").replace("{language}", langLabel)
      : `Not yet in ${langLabel} — English version`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm transition-all duration-300 hover:border-[#c8a86b]/40 hover:shadow-lg">
      <Link href={blogPostPath(post.slug)} className="relative block aspect-[16/10] overflow-hidden bg-[var(--mist)]">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--forest)] to-[var(--night)]">
            <span className="display text-3xl text-gold/30">Mari</span>
          </div>
        )}
        {post.category ? (
          <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
            {post.category}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          {dateLabel ? (
            <time dateTime={post.publishedAt ?? undefined} className="text-xs text-[var(--ink-soft)]">
              {dateLabel}
            </time>
          ) : null}
          {showFallback ? (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200/90">
              {fallbackNote}
            </span>
          ) : null}
        </div>
        <h2 className="mt-2 text-xl font-semibold leading-snug text-[var(--ink)] transition-colors group-hover:text-gold-bright">
          <Link href={blogPostPath(post.slug)}>{post.title}</Link>
        </h2>
        {post.excerpt ? (
          <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink-soft)] line-clamp-3">
            {post.excerpt}
          </p>
        ) : null}
        <Link
          href={blogPostPath(post.slug)}
          className="mt-5 inline-flex text-sm font-semibold text-gold transition-colors hover:text-gold-bright"
        >
          Read article →
        </Link>
      </div>
    </article>
  );
}
