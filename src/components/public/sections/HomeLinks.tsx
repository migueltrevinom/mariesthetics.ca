import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/components/i18n/LanguageContext";
import { SERVICE_LANDING_PAGES } from "@/lib/services/landing/registry";
import { LANDING_CHIP_LABELS } from "@/lib/services/landing/quickLabels";
import { landingSlugForLocale } from "@/lib/services/landing/resolve";
import { serviceLandingPath } from "@/lib/services/landing/paths";
import { blogPostPath } from "@/lib/blog/slug";
import { localeToHreflang } from "@/lib/blog/locales";
import { POST_COPY } from "@/lib/blog/enhance";
import { HOME_LINKS_COPY } from "@/lib/home/seo";
import {
  GUIDE_COPY,
  GUIDE_GROUPS,
  categoryTag,
  durationLabel,
  shortPrice,
  type GuideGroup,
  type TreatmentGuideCard,
} from "@/lib/home/treatmentGuides";
import { getFastIpfsUrl } from "@/lib/ipfs";
import type { BlogListItem } from "@/lib/blog/types";

// Static class maps so Tailwind can see every class.
const SPAN: Record<number, string> = { 1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3", 4: "lg:col-span-4" };
const COLS: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

/** next/image only for https or local paths; anything else falls back to a plain <img>. */
function CardImage({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const url = getFastIpfsUrl(src);
  const cls = "object-cover transition-transform duration-700 ease-out group-hover:scale-105";
  if (/^https:\/\//.test(url) || url.startsWith("/")) {
    return <Image src={url} alt={alt} fill loading="lazy" sizes={sizes} className={cls} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading="lazy" className={`absolute inset-0 h-full w-full ${cls}`} />;
}

function Arrow() {
  return (
    <span
      aria-hidden
      className="inline-block transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
    >
      →
    </span>
  );
}

function GuideCard({ card, locale }: { card: TreatmentGuideCard; locale: Locale }) {
  const def = SERVICE_LANDING_PAGES.find((d) => d.key === card.key)!;
  const copy = HOME_LINKS_COPY[locale] || HOME_LINKS_COPY.en;
  const g = GUIDE_COPY[locale] || GUIDE_COPY.en;
  const name = LANDING_CHIP_LABELS[card.key]?.[locale] || LANDING_CHIP_LABELS[card.key]?.en || card.key;
  const duration = durationLabel(card, g.min);
  return (
    <Link
      href={serviceLandingPath(landingSlugForLocale(def, locale))}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-[var(--card-bg)] transition duration-300 hover:-translate-y-1 hover:border-[var(--line-strong)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--mist)]">
        {card.image ? (
          <CardImage src={card.image} alt={copy.inArea(name)} sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 25vw" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--forest)] to-[var(--night)]">
            <span className="display text-3xl text-[var(--gold)]/30">Mari</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="display text-xl leading-tight text-[var(--ink)] transition-colors group-hover:text-[var(--gold-bright)]">
          {name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{g.benefit[card.key]}</p>
        <div className="mt-auto pt-5">
        <div className="flex items-end justify-between gap-3 border-t border-[var(--line-soft)] pt-4">
          <div className="min-w-0">
            {card.fromCents ? (
              <p className="text-sm font-semibold text-[var(--gold)]">{g.from(`\u2066${shortPrice(card.fromCents)}\u2069`)}</p>
            ) : null}
            {duration ? <p className="mt-0.5 text-xs text-[var(--ink-faint)]">{duration}</p> : null}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink)] group-hover:text-[var(--gold-bright)]">
            {g.viewGuide} <Arrow />
          </span>
        </div>
        </div>
      </div>
    </Link>
  );
}

function formatDate(iso: string | null, locale: Locale): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(localeToHreflang(locale), {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Edmonton",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function PostCard({ post, locale, readMin }: { post: BlogListItem; locale: Locale; readMin?: number }) {
  const tag = categoryTag(post.category, locale);
  const date = formatDate(post.publishedAt, locale);
  const pc = POST_COPY[locale] || POST_COPY.en;
  return (
    <article className="h-full">
      <Link
        href={blogPostPath(post.slug)}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-[var(--card-bg)] transition duration-300 hover:-translate-y-1 hover:border-[var(--line-strong)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--mist)]">
          {post.coverImage ? (
            <CardImage src={post.coverImage} alt={post.title} sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--forest)] to-[var(--night)]">
              <span className="display text-3xl text-[var(--gold)]/30">Mari</span>
            </div>
          )}
          {tag ? (
            <span className="absolute start-3 top-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              {tag}
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h4 className="line-clamp-3 text-base font-medium leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--gold-bright)]">
            {post.title}
          </h4>
          <p className="mt-auto flex flex-wrap items-center gap-x-2 pt-4 text-xs text-[var(--ink-faint)]">
            {date ? <time dateTime={post.publishedAt ?? undefined}>{date}</time> : null}
            {date && readMin ? <span aria-hidden>·</span> : null}
            {readMin ? <span>{pc.minRead(readMin)}</span> : null}
          </p>
        </div>
      </Link>
    </article>
  );
}

/** Server-rendered internal links to service guides and recent posts, as cards with live DB prices. */
export function HomeLinks({
  locale,
  posts,
  cards,
  readMinutes = {},
}: {
  locale: Locale;
  posts: BlogListItem[];
  cards: TreatmentGuideCard[];
  readMinutes?: Record<string, number>;
}) {
  const copy = HOME_LINKS_COPY[locale] || HOME_LINKS_COPY.en;
  const g = GUIDE_COPY[locale] || GUIDE_COPY.en;
  const groups = GUIDE_GROUPS.map((group) => ({ group, items: cards.filter((c) => c.group === group) })).filter(
    (x) => x.items.length > 0
  ) as Array<{ group: GuideGroup; items: TreatmentGuideCard[] }>;

  return (
    <section className="relative overflow-hidden bg-[var(--background)] py-20 md:py-28 transition-colors duration-200">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--line)] to-transparent" />
      <div className="relative mx-auto max-w-6xl px-6 md:px-10">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 className="display mt-4 text-3xl text-[var(--ink)] md:text-5xl">{copy.title}</h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--ink-soft)]">{g.subtitle}</p>

        <div className="mt-12 grid gap-x-6 gap-y-10 lg:grid-cols-4">
          {groups.map(({ group, items }) => (
            <div key={group} className={`min-w-0 ${SPAN[Math.min(items.length, 4)]}`}>
              <div className="flex items-center gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">{g.groups[group]}</p>
                <span aria-hidden className="h-px flex-1 bg-[var(--line)]" />
              </div>
              <ul
                className={`-mx-6 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 ${COLS[Math.min(items.length, 4)]}`}
              >
                {items.map((card) => (
                  <li key={card.key} className="w-[78%] shrink-0 snap-start sm:w-auto">
                    <GuideCard card={card} locale={locale} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {posts.length > 0 && (
          <div className="mt-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h3 className="display text-2xl text-[var(--ink)] md:text-3xl">{copy.posts}</h3>
              <Link
                href="/blog"
                className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gold)] hover:text-[var(--gold-bright)]"
              >
                {g.viewAll} <Arrow />
              </Link>
            </div>
            <ul className="-mx-6 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post._id} className="w-[85%] shrink-0 snap-start sm:w-auto">
                  <PostCard post={post} locale={locale} readMin={readMinutes[post._id]} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
