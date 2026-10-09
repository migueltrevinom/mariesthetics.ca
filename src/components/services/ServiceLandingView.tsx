import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/public/Reveal";
import { formatCad } from "@/lib/money";
import { getLocalizedService } from "@/lib/i18n/serviceTranslations";
import type { Locale } from "@/components/i18n/LanguageContext";
import type { LandingContent } from "@/lib/services/landing/types";
import type { LandingServiceRow, RelatedBlogPost } from "@/lib/services/landing/queries";
import { relatedBlogPath } from "@/lib/services/landing/queries";
import { serviceLandingPath } from "@/lib/services/landing/paths";
type Props = {
  locale: Locale;
  content: LandingContent;
  services: LandingServiceRow[];
  heroImage: string;
  primaryServiceId: string;
  relatedPosts: RelatedBlogPost[];
};

export function ServiceLandingView({
  locale,
  content,
  services,
  heroImage,
  primaryServiceId,
  relatedPosts,
}: Props) {
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div
      lang={locale}
      dir={dir}
      className="aurora grain relative min-h-[90svh] overflow-hidden bg-[var(--background)] pb-24"
    >
      <section className="relative border-b border-[var(--border-color)] pt-32 md:pt-40">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2 md:items-center md:px-10">
          <Reveal>
            <p className="eyebrow">{content.eyebrow}</p>
            <h1 className="display mt-4 text-4xl text-[var(--ink)] md:text-5xl lg:text-6xl">
              {content.h1}
            </h1>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-[var(--ink-soft)] md:text-base">
              {content.intro.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/book?serviceId=${primaryServiceId}`}
                className="btn-primary text-xs !px-6 !py-3"
              >
                {content.bookCta}
              </Link>
              <Link href="/locations/west-edmonton" className="btn-ghost text-xs">
                {content.locationLinkLabel}
              </Link>
              <Link href="/services" className="btn-ghost text-xs">
                {content.allServicesLabel}
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
                unoptimized={
                  heroImage.includes("verifik.co") || heroImage.includes("digitaloceanspaces.com")
                }
              />
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <section className="mt-16 grid gap-12 md:grid-cols-2">
          <Reveal>
            <h2 className="display text-2xl text-[var(--ink)] md:text-3xl">What to expect</h2>
            <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-[var(--ink-soft)]">
              {content.whatToExpect.map((item) => (
                <li key={item.slice(0, 30)}>{item}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="display text-2xl text-[var(--ink)] md:text-3xl">Aftercare</h2>
            <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-[var(--ink-soft)]">
              {content.aftercare.map((item) => (
                <li key={item.slice(0, 30)}>{item}</li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section className="mt-16">
          <Reveal>
            <h2 className="display text-2xl text-[var(--ink)] md:text-3xl">{content.pricingHeading}</h2>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Prices and deposits are loaded from the live studio menu and update automatically.
            </p>
          </Reveal>
          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border-color)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--mist)] text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Treatment</th>
                  <th className="px-4 py-3 font-semibold">Duration</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">Deposit</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => {
                  const localized = getLocalizedService(svc, locale);
                  return (
                    <tr key={svc._id} className="border-t border-[var(--border-color)]">
                      <td className="px-4 py-4 font-medium text-[var(--ink)]">{localized.name}</td>
                      <td className="px-4 py-4 text-[var(--ink-soft)]">{svc.durationMin} min</td>
                      <td className="px-4 py-4 text-[var(--ink)]">{formatCad(svc.priceCents)}</td>
                      <td className="hidden px-4 py-4 text-[var(--ink-soft)] sm:table-cell">
                        {formatCad(svc.depositCents)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/book?serviceId=${svc._id}`}
                          className="text-xs font-semibold text-gold hover:text-gold-bright"
                        >
                          Book →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {relatedPosts.length > 0 ? (
          <section className="mt-16">
            <Reveal>
              <h2 className="display text-2xl text-[var(--ink)] md:text-3xl">
                {content.relatedBlogHeading}
              </h2>
            </Reveal>
            <ul className="mt-6 space-y-4">
              {relatedPosts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={relatedBlogPath(post.slug)}
                    className="block rounded-xl border border-[var(--border-color)] p-4 transition-colors hover:border-gold/40"
                  >
                    <span className="font-semibold text-[var(--ink)]">{post.title}</span>
                    {post.excerpt ? (
                      <p className="mt-1 text-sm text-[var(--ink-soft)] line-clamp-2">{post.excerpt}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-16">
          <Reveal>
            <h2 className="display text-2xl text-[var(--ink)] md:text-3xl">FAQ</h2>
          </Reveal>
          <dl className="mt-6 space-y-6">
            {content.faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-[var(--border-color)] p-5">
                <dt className="font-semibold text-[var(--ink)]">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
