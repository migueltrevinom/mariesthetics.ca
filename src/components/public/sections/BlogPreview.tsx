"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { BlogCard } from "@/components/blog/BlogCard";
import { Reveal } from "@/components/public/Reveal";
import type { BlogListItem } from "@/lib/blog/types";

export function BlogPreview({ posts: initialPosts }: { posts: BlogListItem[] }) {
  const { locale, t } = useLanguage();
  const [posts, setPosts] = useState(initialPosts);

  useEffect(() => {
    fetch(`/api/public/blogs?language=${locale}&limit=3`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      })
      .catch(() => {});
  }, [locale]);

  if (!posts.length) return null;

  const eyebrow =
    t("blog.eyebrow") !== "blog.eyebrow" ? t("blog.eyebrow") : "Skin care journal";
  const title =
    t("blog.previewTitle") !== "blog.previewTitle"
      ? t("blog.previewTitle")
      : "Latest from the blog";
  const subtitle =
    t("blog.previewSubtitle") !== "blog.previewSubtitle"
      ? t("blog.previewSubtitle")
      : "Tips, treatment insights, and studio updates from Mari.";
  const viewAll =
    t("blog.viewAll") !== "blog.viewAll" ? t("blog.viewAll") : "View all articles";

  return (
    <section className="relative bg-[var(--mist)] py-24 md:py-32 transition-colors duration-200">
      <div className="aurora-soft pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h2 className="display mt-4 max-w-xl text-4xl text-[var(--ink)] md:text-5xl">{title}</h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--ink-soft)]">{subtitle}</p>
            </div>
            <Link href="/blog" className="btn-ghost shrink-0 self-start md:self-auto">
              {viewAll} →
            </Link>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={`${post._id}-${locale}`} delay={i * 80}>
              <BlogCard post={post} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
