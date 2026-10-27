import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/components/i18n/LanguageContext";
import { Reveal } from "@/components/public/Reveal";
import { getLocalizedService } from "@/lib/i18n/serviceTranslations";
import { formatCad } from "@/lib/money";
import { VOLUME_COPY } from "@/lib/services/landing/volumeCopy";
import { densityLabel } from "@/lib/services/landing/volumePage";
import type { LandingServiceRow } from "@/lib/services/landing/queries";

type Choice = { key: string; label: string; price: string; bookHref: string; cta: string };

const DURATION_LABEL: Record<Locale, string> = {
  en: "Appointment",
  es: "Duración",
  tl: "Tagal",
  pa: "ਸਮਾਂ",
  ar: "المدة",
};
type PostLink = { title: string; href: string };
type Compare = { sentence: string; lowest: string; href: string; linkLabel: string };

type Props = {
  locale: Locale;
  set?: LandingServiceRow;
  fill?: LandingServiceRow;
  heroImage: string;
  choices: Choice[];
  lashGuideHref: string;
  parkaHref?: string;
  compare: Compare | null;
  posts: PostLink[];
  faqs: Array<{ q: string; a: string }>;
};

function PriceCard({
  service,
  locale,
  cta,
  noteHeading,
}: {
  service: LandingServiceRow;
  locale: Locale;
  cta: string;
  noteHeading?: string;
}) {
  const localized = getLocalizedService(service, locale);
  const c = VOLUME_COPY[locale] || VOLUME_COPY.en;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
      <h3 className="display text-2xl text-[var(--ink)]">{localized.name}</h3>
      <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">{formatCad(service.priceCents)}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">{DURATION_LABEL[locale]}</dt>
          <dd className="text-[var(--ink)]">{service.durationMin} min</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">{c.depositLabel}</dt>
          <dd className="text-[var(--ink)]">
            {formatCad(service.depositCents)}{" "}
            <span className="text-xs text-[var(--ink-soft)]">({c.depositCredited})</span>
          </dd>
        </div>
      </dl>
      {noteHeading && localized.description ? (
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-[var(--ink)]">{noteHeading}</h4>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--ink-soft)]">{localized.description}</p>
        </div>
      ) : localized.description ? (
        <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-[var(--ink-soft)]">{localized.description}</p>
      ) : null}
      <Link href={`/book?serviceId=${service._id}`} className="btn-primary mt-6 text-xs !px-5 !py-2.5">
        {cta}
      </Link>
    </article>
  );
}

export function VolumeLandingView({
  locale,
  set,
  fill,
  heroImage,
  choices,
  lashGuideHref,
  parkaHref,
  compare,
  posts,
  faqs,
}: Props) {
  const c = VOLUME_COPY[locale] || VOLUME_COPY.en;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const primary = set || fill;
  const headlineBits = [set, fill].filter((row): row is LandingServiceRow => !!row).map((row) => {
    const localized = getLocalizedService(row, locale);
    return `${localized.name} ${formatCad(row.priceCents)} · ${row.durationMin} min · ${c.depositLabel} ${formatCad(row.depositCents)}`;
  });

  return (
    <div lang={locale} dir={dir} className="aurora grain relative min-h-[90svh] overflow-hidden bg-[var(--background)] pb-24">
      <section className="relative border-b border-[var(--border-color)] pt-32 md:pt-40">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2 md:items-center md:px-10">
          <Reveal>
            <p className="eyebrow">{c.eyebrow}</p>
            <h1 className="display mt-4 text-4xl text-[var(--ink)] md:text-5xl lg:text-6xl">{c.h1}</h1>
            {headlineBits.length ? (
              <p className="mt-4 text-sm font-medium text-[var(--ink)] md:text-base">{headlineBits.join(" · ")}</p>
            ) : null}
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-[var(--ink-soft)] md:text-base">
              {c.intro.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {primary ? (
                <Link href={`/book?serviceId=${primary._id}`} className="btn-primary text-xs !px-6 !py-3">
                  {set ? c.bookSet : c.bookFill}
                </Link>
              ) : null}
              <Link href="/locations/west-edmonton" className="btn-ghost text-xs">
                {c.locationLinkLabel}
              </Link>
              <Link href={lashGuideHref} className="btn-ghost text-xs">
                {c.lashGuideLabel}
              </Link>
              <Link href="/services" className="btn-ghost text-xs">
                {c.allServicesLabel}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--border-color)] shadow-lg">
              <Image
                src={heroImage}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized={heroImage.includes("verifik.co") || heroImage.includes("digitaloceanspaces.com")}
              />
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <section id="volume-pricing" className="mt-16">
          <Reveal>
            <h2 className="display text-2xl text-[var(--ink)] md:text-3xl">{c.pricingHeading}</h2>
          </Reveal>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {set ? (
              <PriceCard
                service={set}
                locale={locale}
                cta={c.bookSet}
                noteHeading={densityLabel(set.name) ? c.meansHeading : c.meansHeadingGeneric}
              />
            ) : null}
            {fill ? <PriceCard service={fill} locale={locale} cta={c.bookFill} noteHeading={c.fillRulesHeading} /> : null}
          </div>
        </section>

        <section className="mt-16">
          <Reveal>
            <h2 className="display text-2xl text-[var(--ink)] md:text-3xl">{c.suitsHeading}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--ink-soft)] md:text-base">{c.suitsBody}</p>
          </Reveal>
          {choices.length ? (
            <>
              <p className="mt-4 text-xs text-[var(--ink-soft)]">{c.chooserNote}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {choices.map((choice) => (
                  <li key={choice.key} className="rounded-xl border border-[var(--border-color)] p-4">
                    <p className="text-sm font-semibold text-[var(--ink)]">{choice.label}</p>
                    <p className="mt-1 text-[var(--ink)]">{choice.price}</p>
                    <Link href={choice.bookHref} className="mt-3 inline-block text-xs font-semibold text-gold hover:text-gold-bright">
                      {choice.cta}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {parkaHref ? (
              <Link href={parkaHref} className="font-semibold text-gold hover:text-gold-bright">
                {c.parkaLabel}
              </Link>
            ) : null}
            <Link href={lashGuideHref} className="font-semibold text-gold hover:text-gold-bright">
              {c.lashGuideLabel}
            </Link>
          </div>
        </section>

        {compare ? (
          <section className="mt-16">
            <h2 className="display text-2xl text-[var(--ink)] md:text-3xl">{c.compareHeading}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--ink-soft)] md:text-base">
              {compare.sentence} {compare.lowest}{" "}
              <Link href={compare.href} className="font-semibold text-gold hover:text-gold-bright">
                {compare.linkLabel}
              </Link>
            </p>
          </section>
        ) : null}

        {posts.length ? (
          <section className="mt-16">
            <h2 className="display text-2xl text-[var(--ink)] md:text-3xl">{c.postsHeading}</h2>
            <ul className="mt-6 space-y-4">
              {posts.map((post) => (
                <li key={post.href}>
                  <Link href={post.href} className="block rounded-xl border border-[var(--border-color)] p-4 font-semibold text-[var(--ink)] hover:border-gold/40">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {faqs.length ? (
          <section className="mt-16">
            <h2 className="display text-2xl text-[var(--ink)] md:text-3xl">{c.faqHeading}</h2>
            <dl className="mt-6 space-y-6">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-xl border border-[var(--border-color)] p-5">
                  <dt className="font-semibold text-[var(--ink)]">{faq.q}</dt>
                  <dd className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--ink-soft)]">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  );
}
