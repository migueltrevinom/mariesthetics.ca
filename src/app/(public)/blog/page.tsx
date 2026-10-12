import type { Metadata } from "next";
import { BlogListingSection } from "@/components/blog/BlogListingSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/public/Reveal";
import { getPublishedBlogPosts } from "@/lib/blog/queries";
import { getServerLocale } from "@/lib/i18n/locale";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

/** Locale comes from NEXT_LOCALE cookie — must not serve one cached listing for all languages. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description:
    "Skin care tips, lash and brow insights, and studio news from Mari Esthetics — your private esthetics studio in West Edmonton.",
  path: "/blog",
  keywords: [
    "esthetician blog Edmonton",
    "skin care tips West Edmonton",
    "lash lift aftercare",
    "facial skin care advice",
  ],
});

export default async function BlogListingPage() {
  const locale = await getServerLocale();
  const { posts } = await getPublishedBlogPosts(locale, { limit: 48 });

  return (
    <div className="aurora grain relative min-h-[90svh] overflow-hidden pt-36 pb-24 md:pt-44 bg-[var(--background)]">
      <div className="relative mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="eyebrow">Journal</p>
          <h1 className="display mt-5 max-w-3xl text-5xl text-[var(--ink)] md:text-6xl">Blog</h1>
          <p className="mt-6 max-w-2xl text-[var(--ink-soft)] leading-relaxed">
            Latest news, skin care insights, and treatment guidance from Mari Esthetics in West Edmonton.
          </p>
        </Reveal>

        <BlogListingSection initialPosts={posts} />
      </div>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
    </div>
  );
}
