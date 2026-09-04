import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/public/Reveal";
import { BlogCard } from "@/components/public/blog/BlogCard";
import { breadcrumbJsonLd, buildMetadata, seoKeywords } from "@/lib/seo";
import { BlogRepository } from "@/app/api/admin/blogs/repositories/blog.repository";
import { featuredEdmontonLashPost } from "@/lib/blog/featured";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Lash & Skin Journal · West Edmonton",
  description:
    "Aftercare tips, Edmonton weather lash advice, and studio notes from Marinelle at Mari Esthetics — a private home studio in Glastonbury, West Edmonton.",
  path: "/blog",
  keywords: [
    ...seoKeywords,
    "lash extension aftercare Edmonton",
    "lash fill West Edmonton",
    "skincare journal Edmonton",
    "lash extensions Edmonton winter",
  ],
});

async function getPublishedPosts() {
  try {
    const result = await BlogRepository.findAll({
      status: "published",
      language: "en",
      page: 1,
      limit: 24,
    });
    const posts = result.posts.map((p: any) => ({
      title: String(p.title),
      slug: String(p.slug),
      excerpt: String(p.excerpt || ""),
      coverImage: String(p.coverImage || ""),
      publishedAt: p.publishedAt || p.createdAt || null,
      category: String(p.category || ""),
      author: String(p.author || "Marinelle Tala"),
    }));
    if (posts.length === 0) {
      const featured = featuredEdmontonLashPost();
      return [
        {
          title: featured.title,
          slug: featured.slug,
          excerpt: featured.excerpt,
          coverImage: featured.coverImage,
          publishedAt: featured.publishedAt,
          category: featured.category,
          author: featured.author,
        },
      ];
    }
    return posts;
  } catch {
    const featured = featuredEdmontonLashPost();
    return [
      {
        title: featured.title,
        slug: featured.slug,
        excerpt: featured.excerpt,
        coverImage: featured.coverImage,
        publishedAt: featured.publishedAt,
        category: featured.category,
        author: featured.author,
      },
    ];
  }
}

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/blog" },
        ])}
      />

      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <Reveal>
            <p className="eyebrow">The studio journal</p>
            <h1 className="font-[family-name:var(--font-display)] mt-4 text-4xl sm:text-6xl text-[var(--ink)] leading-[1.05]">
              Lash &amp; skin notes from{" "}
              <span className="gold-text italic font-normal">West Edmonton</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--ink-soft)]">
              Aftercare that actually survives chinooks, dry furnace air, and a toque in January.
              Written by Marinelle for clients who want their set to stay pretty past one month.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border-color)] bg-[var(--card-bg)] px-6 py-16 text-center">
              <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                New articles are on the way
              </p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Check back soon for lash aftercare and studio notes.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => (
                <Reveal key={post.slug} delay={i * 60}>
                  <BlogCard post={post} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
