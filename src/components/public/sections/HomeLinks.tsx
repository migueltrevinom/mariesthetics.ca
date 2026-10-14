import Link from "next/link";
import type { Locale } from "@/components/i18n/LanguageContext";
import { SERVICE_LANDING_PAGES } from "@/lib/services/landing/registry";
import { LANDING_CHIP_LABELS } from "@/lib/services/landing/quickLabels";
import { landingSlugForLocale } from "@/lib/services/landing/resolve";
import { serviceLandingPath } from "@/lib/services/landing/paths";
import { blogPostPath } from "@/lib/blog/slug";
import { HOME_LINKS_COPY } from "@/lib/home/seo";
import type { BlogListItem } from "@/lib/blog/types";

/** Server-rendered internal links to service guides and recent posts (keyword-rich anchors). */
export function HomeLinks({ locale, posts }: { locale: Locale; posts: BlogListItem[] }) {
  const copy = HOME_LINKS_COPY[locale] || HOME_LINKS_COPY.en;
  return (
    <section className="relative bg-[var(--background)] py-20 md:py-24 transition-colors duration-200">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 className="display mt-4 text-3xl text-[var(--ink)] md:text-4xl">{copy.title}</h2>
        <ul className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_LANDING_PAGES.map((def) => (
            <li key={def.key}>
              <Link
                href={serviceLandingPath(landingSlugForLocale(def, locale))}
                className="text-[var(--ink)] underline decoration-[var(--gold)] underline-offset-4 hover:text-gold"
              >
                {copy.inArea(LANDING_CHIP_LABELS[def.key]?.[locale] || LANDING_CHIP_LABELS[def.key]?.en || def.key)}
              </Link>
            </li>
          ))}
        </ul>
        {posts.length > 0 && (
          <>
            <h3 className="mt-14 text-lg text-[var(--ink)]">{copy.posts}</h3>
            <ul className="mt-4 space-y-3">
              {posts.map((post) => (
                <li key={post._id}>
                  <Link
                    href={blogPostPath(post.slug)}
                    className="text-ink-soft underline decoration-[var(--line-soft)] underline-offset-4 hover:text-gold"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
