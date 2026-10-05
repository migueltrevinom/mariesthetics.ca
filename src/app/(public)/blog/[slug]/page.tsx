import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/public/Reveal";
import { BlogPromoBand } from "@/components/public/blog/BlogPromoBand";
import { MarkdownContent } from "@/lib/blog/markdown";
import { formatCad } from "@/lib/money";
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  buildMetadata,
  seoKeywords,
} from "@/lib/seo";
import { BlogRepository } from "@/app/api/admin/blogs/repositories/blog.repository";
import { FEATURED_LASH_SERVICES, featuredEdmontonLashPost } from "@/lib/blog/featured";
import { KEEP_LASHES_PRETTY_SLUG } from "@/lib/blog/posts/keepLashesPrettyEdmonton";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";

export const dynamic = "force-dynamic";

type LinkedService = {
  _id: string;
  name: string;
  slug?: string;
  priceCents?: number;
  durationMin?: number;
};

type PublicPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  keywords: string[];
  metaTitle: string;
  metaDescription: string;
  publishedAt: string | null;
  updatedAt: string | null;
  services: LinkedService[];
  promoConfig: {
    enabled: boolean;
    promoCode?: string;
    customPromoText?: string;
    ctaButtonText?: string;
    ctaUrl?: string;
  };
};

function asPost(raw: any): PublicPost | null {
  if (!raw || raw.status !== "published") return null;
  const services = (raw.serviceIds || [])
    .map((s: any) => {
      if (!s || typeof s === "string") return null;
      return {
        _id: String(s._id),
        name: String(s.name || "Service"),
        slug: s.slug ? String(s.slug) : undefined,
        priceCents: typeof s.priceCents === "number" ? s.priceCents : undefined,
        durationMin: typeof s.durationMin === "number" ? s.durationMin : undefined,
      };
    })
    .filter(Boolean) as LinkedService[];

  return {
    title: String(raw.title),
    slug: String(raw.slug),
    excerpt: String(raw.excerpt || ""),
    content: String(raw.content || ""),
    coverImage: String(raw.coverImage || ""),
    category: String(raw.category || ""),
    author: String(raw.author || "Marinelle Tala"),
    keywords: Array.isArray(raw.keywords) ? raw.keywords.map(String) : [],
    metaTitle: String(raw.metaTitle || ""),
    metaDescription: String(raw.metaDescription || ""),
    publishedAt: raw.publishedAt ? new Date(raw.publishedAt).toISOString() : null,
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : null,
    services,
    promoConfig: {
      enabled: Boolean(raw.promoConfig?.enabled),
      promoCode: raw.promoConfig?.promoCode || "",
      customPromoText: raw.promoConfig?.customPromoText || "",
      ctaButtonText: raw.promoConfig?.ctaButtonText || "Book Treatment Now →",
      ctaUrl: raw.promoConfig?.ctaUrl || "/book",
    },
  };
}

async function loadPost(slug: string) {
  try {
    const raw = await BlogRepository.findBySlug(slug);
    const fromDb = asPost(raw);
    if (fromDb) return fromDb;
  } catch {
    // fall through to the featured Edmonton article
  }

  if (slug === KEEP_LASHES_PRETTY_SLUG) {
    const featured = featuredEdmontonLashPost();
    let services: LinkedService[] = [];
    try {
      await connectDb();
      const docs = await Service.find({ _id: { $in: featured.serviceIds }, active: true })
        .select("name slug priceCents durationMin")
        .lean();
      services = docs.map((s: any) => ({
        _id: String(s._id),
        name: String(s.name),
        slug: s.slug ? String(s.slug) : undefined,
        priceCents: typeof s.priceCents === "number" ? s.priceCents : undefined,
        durationMin: typeof s.durationMin === "number" ? s.durationMin : undefined,
      }));
    } catch {
      services = FEATURED_LASH_SERVICES;
    }
    if (services.length === 0) {
      services = FEATURED_LASH_SERVICES;
    }
    return asPost({
      ...featured,
      serviceIds: services,
    });
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) {
    return buildMetadata({
      title: "Article not found",
      path: `/blog/${slug}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    keywords: [...(post.keywords || []), ...seoKeywords].filter(Boolean),
    ogImage: post.coverImage || undefined,
    ogType: "article",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  void BlogRepository.incrementViews(slug).catch(() => undefined);

  const dateLabel = formatDate(post.publishedAt);

  return (
    <article className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Journal", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          blogPostingJsonLd({
            title: post.title,
            excerpt: post.excerpt,
            description: post.metaDescription || post.excerpt,
            slug: post.slug,
            coverImage: post.coverImage,
            author: post.author,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            keywords: post.keywords,
            category: post.category,
          }),
        ]}
      />

      <header className="relative overflow-hidden pt-32 pb-10 md:pt-40">
        <div className="mx-auto max-w-3xl px-6 md:px-10">
          <Reveal>
            <Link
              href="/blog"
              className="text-xs font-semibold uppercase tracking-wider text-[#c8a86b] hover:text-[var(--ink)]"
            >
              ← Journal
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">
              {post.category ? (
                <span className="rounded-full border border-[#c8a86b]/30 bg-[#c8a86b]/10 px-2.5 py-1 text-[#c8a86b]">
                  {post.category}
                </span>
              ) : null}
              {dateLabel ? <span>{dateLabel}</span> : null}
              <span>By {post.author}</span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] mt-4 text-4xl sm:text-5xl leading-[1.08] text-[var(--ink)]">
              {post.title}
            </h1>
            {post.excerpt ? (
              <p className="mt-5 text-lg leading-relaxed text-[var(--ink-soft)]">{post.excerpt}</p>
            ) : null}
          </Reveal>
        </div>
      </header>

      {post.coverImage ? (
        <div className="mx-auto max-w-4xl px-6 md:px-10">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <MarkdownContent content={post.content} />

        {post.promoConfig.enabled ? (
          <BlogPromoBand
            promoCode={post.promoConfig.promoCode}
            customPromoText={post.promoConfig.customPromoText}
            ctaButtonText={post.promoConfig.ctaButtonText}
            ctaUrl={post.promoConfig.ctaUrl}
          />
        ) : (
          <BlogPromoBand ctaUrl="/book" ctaButtonText="Book a Lash Appointment →" />
        )}

        {post.services.length > 0 ? (
          <section className="mt-14">
            <p className="eyebrow">Book these treatments</p>
            <h2 className="font-[family-name:var(--font-display)] mt-2 text-2xl text-[var(--ink)]">
              Related lash appointments
            </h2>
            <div className="mt-6 grid gap-3">
              {post.services.map((service) => (
                <Link
                  key={service._id}
                  href={`/book?serviceId=${service._id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-4 transition hover:border-[#c8a86b]"
                >
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{service.name}</p>
                    <p className="text-xs text-[var(--ink-soft)]">
                      {service.durationMin ? `${service.durationMin} min` : "By appointment"}
                      {typeof service.priceCents === "number" ? ` · ${formatCad(service.priceCents)}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#c8a86b]">Book →</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
