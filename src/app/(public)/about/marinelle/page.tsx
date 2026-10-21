import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { AUTHORS, DEFAULT_BLOG_AUTHOR, personJsonLd } from "@/lib/blog/authors";
import { getPostsByAuthor } from "@/lib/blog/queries";
import { blogPostPath } from "@/lib/blog/slug";
import { getServerLocale } from "@/lib/i18n/locale";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { localeToHreflang } from "@/lib/blog/locales";

export const dynamic = "force-dynamic";

const author = AUTHORS[DEFAULT_BLOG_AUTHOR];
const COPY = {
  en: { posts: "Articles by Marinelle", insta: "Instagram" },
  es: { posts: "Artículos de Marinelle", insta: "Instagram" },
  tl: { posts: "Mga artikulo ni Marinelle", insta: "Instagram" },
  pa: { posts: "Marinelle ਦੇ ਲੇਖ", insta: "Instagram" },
  ar: { posts: "مقالات مارينيل", insta: "إنستغرام" },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return buildMetadata({
    title: `${author.name} – ${author.jobTitle[locale]}`,
    description: author.bio[locale],
    path: "/about/marinelle",
  });
}

export default async function AuthorPage() {
  const locale = await getServerLocale();
  const posts = await getPostsByAuthor(author.name, locale);
  const c = COPY[locale] || COPY.en;
  return (
    <div className="aurora grain relative min-h-[80svh] bg-[var(--background)] pt-32 pb-24 md:pt-40" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl px-6 md:px-10">
        <p className="eyebrow">{author.jobTitle[locale]}</p>
        <h1 className="display mt-4 text-4xl text-[var(--ink)] md:text-5xl">{author.name}</h1>
        <p className="mt-6 text-lg leading-relaxed text-[var(--ink-soft)]">{author.bio[locale]}</p>
        <p className="mt-4 text-sm">
          {author.sameAs.map((u) => (
            <a key={u} href={u} target="_blank" rel="noopener noreferrer me" className="underline underline-offset-4 hover:text-gold">{c.insta}</a>
          ))}
        </p>
        {posts.length > 0 && (
          <section className="mt-14">
            <h2 className="display text-2xl text-[var(--ink)]">{c.posts}</h2>
            <ul className="mt-6 space-y-3">
              {posts.map((p) => (
                <li key={p._id}>
                  <Link href={blogPostPath(p.slug)} className="text-[var(--ink)] underline decoration-[var(--line-soft)] underline-offset-4 hover:text-gold">{p.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "ProfilePage", inLanguage: localeToHreflang(locale), mainEntity: personJsonLd(author, locale) },
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: author.name, path: "/about/marinelle" }], { inLanguage: localeToHreflang(locale) }),
        ]}
      />
    </div>
  );
}
