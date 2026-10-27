import { getOpeningHoursSpec } from "@/lib/businessHours";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { LEGACY_SERVICE_LANDING_REDIRECTS, SERVICE_LANDING_PAGES } from "@/lib/services/landing/registry";
import { normalizeServiceLandingSlugParam } from "@/lib/services/landing/paths";
import { ServiceLandingView } from "@/components/services/ServiceLandingView";
import { VolumeLandingView } from "@/components/services/VolumeLandingView";
import { ServiceLandingTranslationProvider } from "@/components/services/ServiceLandingTranslationContext";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLandingContent } from "@/lib/services/landing/content";
import { applyLandingDurations } from "@/lib/services/landing/durations";
import {
  loadRelatedBlogPosts,
  loadServicesForLanding,
  primaryLandingImage,
} from "@/lib/services/landing/queries";
import { serviceLandingPath } from "@/lib/services/landing/paths";
import {
  hreflangAlternatesForLanding,
  landingSlugForLocale,
  resolveLandingBySlugParam,
  slugsByLocaleForLanding,
} from "@/lib/services/landing/resolve";
import { localeToHreflang } from "@/lib/blog/locales";
import { buildLashFaq, buildLashSummary, LASH_COPY, lashPriceTitle } from "@/lib/services/landing/lashSummary";
import { buildVolumeFaqs, buildVolumeHead, volumeCompareLine, volumeServiceJsonLd } from "@/lib/services/landing/volumePage";
import { LASH_PAGE_VOLUME_LINK, VOLUME_COPY } from "@/lib/services/landing/volumeCopy";
import { pickVolumePair } from "@/lib/services/landing/volumeMatch";
import { VOLUME_COST_POST, VOLUME_FEATURED_POSTS, VOLUME_PARKA_POST, resolvePublishedVolumePosts, volumePostPath } from "@/lib/services/landing/volumePosts";
import { AUTHORS, DEFAULT_BLOG_AUTHOR, personJsonLd } from "@/lib/blog/authors";
import { formatCad } from "@/lib/money";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  localBusinessJsonLd,
  serviceLandingJsonLd,
  business,
  siteUrl,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveLandingBySlugParam(slug);
  if (!resolved) {
    return buildMetadata({ title: "Service not found", path: "/services", noindex: true });
  }

  const content = getLandingContent(resolved.definition.key, resolved.locale);
  const path = serviceLandingPath(resolved.pathSlug);
  const services = await loadServicesForLanding(resolved.definition);
  const heroImage = primaryLandingImage(services, resolved.definition.heroServiceSlug);

  // Lash guides: live prices from the DB in the title (never hardcoded).
  let title = content.metaTitle;
  let description = content.metaDescription;
  let absoluteTitle = false;
  if (resolved.definition.key === "volume-lashes") {
    const head = buildVolumeHead(services, resolved.locale, business.name);
    if (head) {
      title = head.title;
      description = head.description;
      absoluteTitle = !head.withBrand;
    }
  } else if (resolved.definition.key === "lash-extensions") {
    const head = lashPriceTitle(buildLashSummary(services), resolved.locale, business.name);
    if (head) {
      title = head.title;
      absoluteTitle = !head.withBrand;
    }
  }

  return buildMetadata({
    title,
    absoluteTitle,
    description,
    path,
    hreflangAlternates: hreflangAlternatesForLanding(resolved.definition),
    ogLocale: localeToHreflang(resolved.locale).replace("-", "_"),
    ogImage: heroImage,
  });
}

export default async function ServiceLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const legacyTarget = LEGACY_SERVICE_LANDING_REDIRECTS[normalizeServiceLandingSlugParam(slug)];
  if (legacyTarget) permanentRedirect(serviceLandingPath(legacyTarget));
  const resolved = resolveLandingBySlugParam(slug);
  if (!resolved) notFound();

  const { definition, locale } = resolved;
  const services = await loadServicesForLanding(definition);
  if (!services.length) notFound();
  // Appointment lengths always come from live DB durations, never hardcoded copy.
  const content = applyLandingDurations(getLandingContent(definition.key, locale), services, locale);

  const hero =
    services.find((s) => s.slug === definition.heroServiceSlug) || services[0];
  const heroImage = primaryLandingImage(services, definition.heroServiceSlug) || "";
  const pagePath = serviceLandingPath(resolved.pathSlug);
  const pageUrl = `${siteUrl}${pagePath}`;
  const inLanguage = localeToHreflang(locale);
  const lashSummary = definition.key === "lash-extensions" ? buildLashSummary(services) : null;
  const lashFaqs = lashSummary ? buildLashFaq(lashSummary, locale) : [];
  const volumeDef = SERVICE_LANDING_PAGES.find((d) => d.key === "volume-lashes");
  const volumeGuide =
    definition.key === "lash-extensions" && volumeDef
      ? { href: serviceLandingPath(landingSlugForLocale(volumeDef, locale)), label: LASH_PAGE_VOLUME_LINK[locale] || LASH_PAGE_VOLUME_LINK.en }
      : null;

  if (definition.key === "volume-lashes") {
    const pair = pickVolumePair(services);
    const ordered = [pair.set, pair.fill].filter((row): row is NonNullable<typeof pair.set> => !!row);
    const lashDef = SERVICE_LANDING_PAGES.find((d) => d.key === "lash-extensions")!;
    const summary = buildLashSummary(await loadServicesForLanding(lashDef));
    const lashCopy = LASH_COPY[locale] || LASH_COPY.en;
    const choices = (summary?.lines || [])
      .filter((line) => line.set)
      .map((line) => ({
        key: line.type,
        label: lashCopy.type[line.type],
        price: formatCad(line.set!.priceCents),
        bookHref: `/book?serviceId=${line.set!._id}`,
        cta: lashCopy.book(lashCopy.type[line.type]),
      }));
    const parkaPath = volumePostPath(VOLUME_PARKA_POST[locale] || VOLUME_PARKA_POST.en);
    const posts = (await resolvePublishedVolumePosts(VOLUME_FEATURED_POSTS[locale] || VOLUME_FEATURED_POSTS.en)).map((post) => ({
      title: post.title,
      href: volumePostPath(post.slug),
    }));
    const compareLine = volumeCompareLine(locale);
    const volumeCopy = VOLUME_COPY[locale] || VOLUME_COPY.en;
    const compare = compareLine
      ? { ...compareLine, href: volumePostPath(VOLUME_COST_POST[locale] || VOLUME_COST_POST.en), linkLabel: volumeCopy.compareLinkLabel }
      : null;
    const volumeFaqs = buildVolumeFaqs(ordered, locale, `${siteUrl}${parkaPath}`);
    const head = buildVolumeHead(ordered, locale, business.name);
    const volumeHero = primaryLandingImage(ordered, definition.heroServiceSlug) || heroImage;
    return (
      <ServiceLandingTranslationProvider slugsByLocale={slugsByLocaleForLanding(definition)}>
        <VolumeLandingView
          locale={locale}
          set={pair.set}
          fill={pair.fill}
          heroImage={volumeHero}
          choices={choices}
          lashGuideHref={serviceLandingPath(landingSlugForLocale(lashDef, locale))}
          parkaHref={parkaPath}
          compare={compare}
          posts={posts}
          faqs={volumeFaqs}
        />
        <JsonLd
          data={[
            volumeServiceJsonLd({
              name: content.h1,
              description: [head?.description || content.metaDescription, pair.set?.description, pair.fill?.description].filter(Boolean).join(" "),
              url: pageUrl,
              image: volumeHero,
              services: ordered,
            }),
            { "@context": "https://schema.org", ...personJsonLd(AUTHORS[DEFAULT_BLOG_AUTHOR], locale) },
            { ...faqJsonLd(volumeFaqs), inLanguage },
            breadcrumbJsonLd(
              [
                { name: "Home", path: "/" },
                { name: "Services", path: "/services" },
                { name: content.h1, path: pagePath },
              ],
              { inLanguage }
            ),
          ]}
        />
      </ServiceLandingTranslationProvider>
    );
  }

  const relatedPosts = await loadRelatedBlogPosts(services.map((s) => s._id), locale);

  return (
    <ServiceLandingTranslationProvider slugsByLocale={slugsByLocaleForLanding(definition)}>
      <ServiceLandingView
        locale={locale}
        content={content}
        services={services}
        heroImage={heroImage}
        primaryServiceId={hero._id}
        relatedPosts={relatedPosts}
        lashSummary={lashSummary}
        extraFaqs={lashFaqs}
        volumeGuide={volumeGuide}
      />
      <JsonLd
        data={[
          localBusinessJsonLd({ openingHours: await getOpeningHoursSpec() }),
          serviceLandingJsonLd({
            name: content.h1,
            description: content.metaDescription,
            url: pageUrl,
            image: heroImage,
            offers: services.map((s) => ({ name: s.name, priceCents: s.priceCents, id: s._id })),
          }),
          { ...faqJsonLd([...lashFaqs, ...content.faqs].map((f) => ({ q: f.q, a: f.a }))), inLanguage },
          breadcrumbJsonLd(
            [
              { name: "Home", path: "/" },
              { name: "Services", path: "/services" },
              { name: content.h1, path: pagePath },
            ],
            { inLanguage }
          ),
        ]}
      />
    </ServiceLandingTranslationProvider>
  );
}
