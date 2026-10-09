import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { BlogPromoCta } from "@/components/blog/BlogPromoCta";
import { BlogRelatedServices } from "@/components/blog/BlogRelatedServices";
import { BlogTranslationProvider } from "@/components/blog/BlogTranslationContext";
import { BlogLocaleFallbackNotice } from "@/components/blog/BlogLocaleFallbackNotice";
import { formatBlogDate } from "@/components/blog/formatBlogDate";
import {
  blogLanguageDir,
  buildBlogHreflangAlternates,
  localeToHreflang,
} from "@/lib/blog/locales";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getPublishedBlogPostBySlug,
  getPublishedBlogSlugs,
  incrementBlogPostViews,
} from "@/lib/blog/queries";
import type { Locale } from "@/components/i18n/LanguageContext";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildMetadata,
  localBusinessJsonLd,
  siteUrl,
} from "@/lib/seo";

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPublishedBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    return buildMetadata({ title: "Article not found", path: `/blog/${slug}`, noindex: true });
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || post.title;
  const ogImage = post.coverImage
    ? post.coverImage.startsWith("http")
      ? post.coverImage
      : `${siteUrl}${post.coverImage}`
    : undefined;

  const hreflangAlternates = buildBlogHreflangAlternates(post.translations);

  return buildMetadata({
    title,
    description,
    path: `/blog/${post.slug}`,
    ogImage,
    ogType: "article",
    publishedTime: post.publishedAt ?? undefined,
    modifiedTime: post.updatedAt ?? undefined,
    authors: [post.author],
    hreflangAlternates,
    ogLocale: localeToHreflang(post.language).replace("-", "_"),
  });
}

function slugsByLocale(
  translations: Array<{ language: string; slug: string }>
): Partial<Record<Locale, string>> {
  const map: Partial<Record<Locale, string>> = {};
  for (const t of translations) {
    if (["en", "es", "tl", "pa", "ar"].includes(t.language)) {
      map[t.language as Locale] = t.slug;
    }
  }
  return map;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  void incrementBlogPostViews(post.slug);

  const dateLabel = formatBlogDate(post.publishedAt);
  const description = post.metaDescription || post.excerpt || post.title;
  const dir = blogLanguageDir(post.language);
  const inLanguage = localeToHreflang(post.language);

  return (
    <BlogTranslationProvider slugsByLocale={slugsByLocale(post.translations)}>
      <article
        lang={post.language}
        dir={dir}
        className="aurora grain relative min-h-[90svh] overflow-hidden pt-32 pb-24 md:pt-40 bg-[var(--background)]"
      >
        <div className="relative mx-auto max-w-3xl px-6 md:px-10">
          <nav className="text-sm text-[var(--ink-soft)]">
            <Link href="/blog" className="transition-colors hover:text-gold-bright">
              ← Back to blog
            </Link>
          </nav>

          <BlogLocaleFallbackNotice postLanguage={post.language} />

          <header className="mt-8">
            {post.category ? (
              <p className="eyebrow">{post.category}</p>
            ) : (
              <p className="eyebrow">Mari Esthetics</p>
            )}
            <h1 className="display mt-4 text-4xl text-[var(--ink)] md:text-5xl lg:text-6xl">{post.title}</h1>
            {post.excerpt ? (
              <p className="mt-6 text-lg leading-relaxed text-[var(--ink-soft)]">{post.excerpt}</p>
            ) : null}
            <p className="mt-6 text-sm text-[var(--ink-soft)]">
              <span className="font-semibold text-[var(--ink)]">{post.author}</span>
              {dateLabel ? (
                <>
                  <span className="mx-2 opacity-40">·</span>
                  <time dateTime={post.publishedAt ?? undefined}>{dateLabel}</time>
                </>
              ) : null}
            </p>
          </header>

          {post.coverImage ? (
            <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--border-color)]">
              <img
                src={post.coverImage}
                alt=""
                className="w-full max-h-[480px] object-cover"
                fetchPriority="high"
              />
            </div>
          ) : null}

          <BlogPromoCta promo={post.resolvedPromo} variant="inline" />

          <div className="mt-10">
            <BlogPostBody content={post.content} />
          </div>

          <BlogRelatedServices services={post.serviceIds} />

          <BlogPromoCta promo={post.resolvedPromo} variant="closing" />
        </div>

        <JsonLd
          data={[
            localBusinessJsonLd(),
            articleJsonLd({
              title: post.title,
              description,
              slug: post.slug,
              coverImage: post.coverImage,
              author: post.author,
              publishedAt: post.publishedAt,
              modifiedAt: post.updatedAt,
              inLanguage,
            }),
            breadcrumbJsonLd(
              [
                { name: "Home", path: "/" },
                { name: "Blog", path: "/blog" },
                { name: post.title, path: `/blog/${post.slug}` },
              ],
              { inLanguage }
            ),
          ]}
        />
      </article>
    </BlogTranslationProvider>
  );
}
