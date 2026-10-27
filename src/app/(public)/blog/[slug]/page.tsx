import { BlogLashGuideLink, isLashPost } from "@/components/blog/BlogLashGuideLink";
import { getOpeningHoursSpec } from "@/lib/businessHours";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { enhancePostHtml, POST_COPY } from "@/lib/blog/enhance";
import { authorFor, authorPath, personJsonLd } from "@/lib/blog/authors";
import { landingDefinitionForService, landingSlugForLocale } from "@/lib/services/landing/resolve";
import { serviceLandingPath } from "@/lib/services/landing/paths";
import { LANDING_CHIP_LABELS } from "@/lib/services/landing/quickLabels";
import { SERVICE_LANDING_PAGES } from "@/lib/services/landing/registry";
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
  getRelatedPosts,
  incrementBlogPostViews,
} from "@/lib/blog/queries";
import { blogPostPath, normalizeBlogSlugForLookup } from "@/lib/blog/slug";
import type { Locale } from "@/components/i18n/LanguageContext";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  localBusinessJsonLd,
  siteUrl,
} from "@/lib/seo";

/** Avoid stale ISR 404s for non-Latin slugs; resolve from DB per request. */
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    const path = blogPostPath(normalizeBlogSlugForLookup(slug) || slug);
    return buildMetadata({ title: "Article not found", path, noindex: true });
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
    path: blogPostPath(post.slug),
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
  const lang = post.language as Locale;
  const copy = POST_COPY[lang] || POST_COPY.en;

  // Service guide for breadcrumb/alt: first linked service with a guide, else category.
  const svc = post.serviceIds[0];
  const guideDef =
    post.serviceIds
      .map((s) => landingDefinitionForService({ category: s.category || "", slug: s.slug || "", name: s.name, _id: s._id }))
      .find(Boolean) ||
    (post.category === "lashes" ? SERVICE_LANDING_PAGES.find((d) => d.key === "lash-extensions") : undefined);
  const guideLabel = guideDef ? LANDING_CHIP_LABELS[guideDef.key]?.[lang] || LANDING_CHIP_LABELS[guideDef.key]?.en : undefined;
  const guidePathStr = guideDef ? serviceLandingPath(landingSlugForLocale(guideDef, lang)) : undefined;
  const altFallback = copy.alt(guideLabel || svc?.name || post.category || "Mari Esthetics", post.title);

  const enhanced = enhancePostHtml(post.content, altFallback);
  const shortAnswer = (post.shortAnswer || "").trim();
  const author = authorFor(post.author);
  const related = await getRelatedPosts(post, 4);
  const coverAlt = (post.coverImageAlt || "").trim() || altFallback;
  const extraImages = (post.images || []).map((i) => ({ ...i, alt: i.alt.trim() || altFallback }));
  const abs = (u: string) => (u.startsWith("http") ? u : `${siteUrl}${u}`);
  const imageObjects = [
    ...(post.coverImage ? [{ url: post.coverImage, alt: coverAlt }] : []),
    ...extraImages,
    ...enhanced.inlineImages,
  ].map((i) => ({ "@type": "ImageObject", url: abs(i.url), contentUrl: abs(i.url), caption: i.alt, inLanguage }));

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
              {copy.by}{" "}
              {author ? (
                <Link href={authorPath(author)} rel="author" className="font-semibold text-[var(--ink)] underline-offset-4 hover:underline">{author.name}</Link>
              ) : (
                <span className="font-semibold text-[var(--ink)]">{post.author}</span>
              )}
              <span className="mx-2 opacity-40">·</span>
              <span>{copy.minRead(enhanced.readMinutes)}</span>
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
                alt={coverAlt}
                className="w-full max-h-[480px] object-cover"
                fetchPriority="high"
              />
            </div>
          ) : null}

          {shortAnswer ? (
            <section className="mt-10 rounded-2xl border border-gold/40 bg-[var(--card-bg)] p-6" aria-labelledby="short-answer">
              <h2 id="short-answer" className="display text-2xl text-[var(--ink)]">{copy.shortAnswer}</h2>
              <p className="mt-3 text-base leading-relaxed text-[var(--ink)]">{shortAnswer}</p>
            </section>
          ) : null}

          <BlogPromoCta promo={post.resolvedPromo} variant="inline" />

          {enhanced.toc.length >= 3 ? (
            <nav aria-label={copy.toc} className="mt-10 rounded-2xl border border-[var(--border-color)] p-5 text-sm">
              <p className="eyebrow">{copy.toc}</p>
              <ol className="mt-3 list-decimal space-y-1 ps-5">
                {enhanced.toc.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="text-[var(--ink-soft)] hover:text-gold">{t.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div className="mt-10">
            <BlogPostBody content={enhanced.html} />
          </div>

          {extraImages.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {extraImages.map((img) => (
                <figure key={img.url}>
                  <img src={img.url} alt={img.alt} loading="lazy" className="w-full rounded-xl border border-[var(--border-color)] object-cover" />
                  {img.caption ? <figcaption className="mt-2 text-xs text-[var(--ink-soft)]">{img.caption}</figcaption> : null}
                </figure>
              ))}
            </div>
          ) : null}

          {isLashPost(post) ? <BlogLashGuideLink language={post.language as Locale} /> : null}

          <BlogRelatedServices services={post.serviceIds} language={post.language as Locale} />

          {related.length > 0 ? (
            <section className="mt-14 border-t border-[var(--border-color)] pt-10">
              <p className="eyebrow">{copy.related}</p>
              <ul className="mt-4 space-y-3">
                {related.map((r) => (
                  <li key={r._id}>
                    <Link href={blogPostPath(r.slug)} className="font-semibold text-[var(--ink)] underline decoration-[var(--line-soft)] underline-offset-4 hover:text-gold">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <BlogPromoCta promo={post.resolvedPromo} variant="closing" />
        </div>

        <JsonLd
          data={[
            localBusinessJsonLd({ openingHours: await getOpeningHoursSpec() }),
            {
              ...articleJsonLd({
              title: post.title,
              description,
              slug: post.slug,
              coverImage: post.coverImage,
              author: post.author,
              publishedAt: post.publishedAt,
              modifiedAt: post.updatedAt,
              inLanguage,
            }),
              ...(imageObjects.length ? { image: imageObjects } : {}),
              ...(author ? { author: personJsonLd(author, lang) } : {}),
              timeRequired: `PT${enhanced.readMinutes}M`,
              ...(shortAnswer || enhanced.firstParagraph ? { abstract: shortAnswer || enhanced.firstParagraph } : {}),
            },
            ...(enhanced.faqs.length ? [{ ...faqJsonLd(enhanced.faqs), inLanguage }] : []),
            breadcrumbJsonLd(
              [
                { name: copy.home, path: "/" },
                { name: copy.blog, path: "/blog" },
                ...(guideDef && guidePathStr ? [{ name: guideLabel || guideDef.key, path: guidePathStr }] : []),
                { name: post.title, path: blogPostPath(post.slug) },
              ],
              { inLanguage }
            ),
          ]}
        />
      </article>
    </BlogTranslationProvider>
  );
}
