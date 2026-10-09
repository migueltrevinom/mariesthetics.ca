import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { BlogPromoCta } from "@/components/blog/BlogPromoCta";
import { BlogRelatedServices } from "@/components/blog/BlogRelatedServices";
import { formatBlogDate } from "@/components/blog/formatBlogDate";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getPublishedBlogPostBySlug,
  getPublishedBlogSlugs,
  incrementBlogPostViews,
} from "@/lib/blog/queries";
import { getServerLocale } from "@/lib/i18n/locale";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata, siteUrl } from "@/lib/seo";

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPublishedBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerLocale();
  const post = await getPublishedBlogPostBySlug(slug, locale);

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

  return buildMetadata({
    title,
    description,
    path: `/blog/${post.slug}`,
    ogImage,
    ogType: "article",
    publishedTime: post.publishedAt ?? undefined,
    authors: [post.author],
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getServerLocale();
  const post = await getPublishedBlogPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  void incrementBlogPostViews(post.slug);

  const dateLabel = formatBlogDate(post.publishedAt);
  const description = post.metaDescription || post.excerpt || post.title;

  return (
    <article className="aurora grain relative min-h-[90svh] overflow-hidden pt-32 pb-24 md:pt-40 bg-[var(--background)]">
      <div className="relative mx-auto max-w-3xl px-6 md:px-10">
        <nav className="text-sm text-[var(--ink-soft)]">
          <Link href="/blog" className="transition-colors hover:text-gold-bright">
            ← Back to blog
          </Link>
        </nav>

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

        <BlogPromoCta promo={post.promoConfig} variant="inline" />

        <div className="mt-10">
          <BlogPostBody content={post.content} />
        </div>

        <BlogRelatedServices services={post.serviceIds} />

        <BlogPromoCta promo={post.promoConfig} variant="closing" />
      </div>

      <JsonLd
        data={[
          articleJsonLd({
            title: post.title,
            description,
            slug: post.slug,
            coverImage: post.coverImage,
            author: post.author,
            publishedAt: post.publishedAt,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
    </article>
  );
}
