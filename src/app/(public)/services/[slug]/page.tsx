import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceLandingView } from "@/components/services/ServiceLandingView";
import { ServiceLandingTranslationProvider } from "@/components/services/ServiceLandingTranslationContext";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLandingContent } from "@/lib/services/landing/content";
import {
  loadRelatedBlogPosts,
  loadServicesForLanding,
  primaryLandingImage,
} from "@/lib/services/landing/queries";
import { serviceLandingPath } from "@/lib/services/landing/paths";
import {
  hreflangAlternatesForLanding,
  resolveLandingBySlugParam,
  slugsByLocaleForLanding,
} from "@/lib/services/landing/resolve";
import { localeToHreflang } from "@/lib/blog/locales";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  localBusinessJsonLd,
  serviceLandingJsonLd,
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

  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path,
    hreflangAlternates: hreflangAlternatesForLanding(resolved.definition),
    ogLocale: localeToHreflang(resolved.locale).replace("-", "_"),
    ogImage: heroImage,
  });
}

export default async function ServiceLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const resolved = resolveLandingBySlugParam(slug);
  if (!resolved) notFound();

  const { definition, locale } = resolved;
  const content = getLandingContent(definition.key, locale);
  const services = await loadServicesForLanding(definition);
  if (!services.length) notFound();

  const hero =
    services.find((s) => s.slug === definition.heroServiceSlug) || services[0];
  const heroImage = primaryLandingImage(services, definition.heroServiceSlug) || "";
  const relatedPosts = await loadRelatedBlogPosts(services.map((s) => s._id));
  const pagePath = serviceLandingPath(resolved.pathSlug);
  const pageUrl = `${siteUrl}${pagePath}`;
  const inLanguage = localeToHreflang(locale);

  return (
    <ServiceLandingTranslationProvider slugsByLocale={slugsByLocaleForLanding(definition)}>
      <ServiceLandingView
        locale={locale}
        content={content}
        services={services}
        heroImage={heroImage}
        primaryServiceId={hero._id}
        relatedPosts={relatedPosts}
      />
      <JsonLd
        data={[
          localBusinessJsonLd(),
          serviceLandingJsonLd({
            name: content.h1,
            description: content.metaDescription,
            url: pageUrl,
            image: heroImage,
            offers: services.map((s) => ({ name: s.name, priceCents: s.priceCents })),
          }),
          faqJsonLd(content.faqs.map((f) => ({ q: f.q, a: f.a }))),
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
