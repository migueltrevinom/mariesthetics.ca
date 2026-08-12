"use client";

import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/public/Reveal";
import { formatCad } from "@/lib/money";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { getLocalizedService } from "@/lib/i18n/serviceTranslations";
import { MembershipBand } from "@/components/public/sections/MembershipBand";

export type ServiceItem = {
  _id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  depositCents: number;
  category: string;
  photos: string[];
  slug?: string;
  nameTranslations?: Record<string, string>;
  descriptionTranslations?: Record<string, string>;
};

export type PlanItem = {
  _id: string;
  name: string;
  description: string;
  interval: string;
  priceCents: number;
  billingNote?: string;
  visitsPerPeriod?: number;
  includedServiceIds?: any[];
};

export type CategoryItem = {
  _id: string;
  name: string;
  slug: string;
  description: string;
};

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  facials: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800",
  facial: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800",
  lashes: "https://images.unsplash.com/photo-1583001809873-a1284d563572?auto=format&fit=crop&q=80&w=800",
  permanentMakeUp: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
  brows: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
  general: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
};

interface ServicesContentProps {
  services: ServiceItem[];
  plans: PlanItem[];
  dbCategories: CategoryItem[];
  offline: boolean;
}

export function ServicesContent({
  services,
  plans,
  dbCategories,
  offline,
}: ServicesContentProps) {
  const { locale, t } = useLanguage();

  const categoryMap: Record<string, CategoryItem> = {};
  dbCategories.forEach((c) => {
    categoryMap[c.slug] = c;
  });

  const categories = Array.from(new Set(services.map((s) => s.category)));

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] min-h-screen">
      {/* Hero band */}
      <section className="aurora relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24 border-b border-[var(--border-color)]">
        <div className="grain absolute inset-0 opacity-10" />
        <div className="relative mx-auto max-w-6xl px-6 md:px-10 text-center sm:text-left">
          <p className="reveal eyebrow">
            {t("servicesPage.heroEyebrow") !== "servicesPage.heroEyebrow"
              ? t("servicesPage.heroEyebrow")
              : "Treatment Catalog & Pricing"}
          </p>
          <h1 className="reveal reveal-delay-1 display mt-4 max-w-3xl text-4xl sm:text-5xl md:text-7xl text-[var(--ink)] tracking-tight">
            {t("servicesPage.heroTitle1") !== "servicesPage.heroTitle1"
              ? t("servicesPage.heroTitle1")
              : "Curated Esthetics."}{" "}
            <span className="gold-text italic block sm:inline">
              {t("servicesPage.heroTitle2") !== "servicesPage.heroTitle2"
                ? t("servicesPage.heroTitle2")
                : "Transparent Pricing."}
            </span>
          </h1>
          <p className="reveal reveal-delay-2 mt-6 max-w-2xl text-sm sm:text-base text-[var(--ink-soft)] leading-relaxed">
            {t("servicesPage.heroSubtitle") !== "servicesPage.heroSubtitle"
              ? t("servicesPage.heroSubtitle")
              : "Every treatment is tailored to your unique skin & beauty goals in a private, serene Edmonton studio. A deposit secures your appointment; the balance is settled upon completion."}
          </p>

          {/* Quick Anchor Bar */}
          {categories.length > 0 && (
            <div className="reveal reveal-delay-3 mt-10 flex flex-wrap items-center gap-2.5">
              {categories.map((c) => {
                const catName =
                  t(`servicesPage.categories.${c}`) !== `servicesPage.categories.${c}`
                    ? t(`servicesPage.categories.${c}`)
                    : categoryMap[c]?.name || c;
                return (
                  <a key={c} href={`#${c}`} className="chip font-medium shadow-sm hover:scale-105 transition-all">
                    {catName}
                  </a>
                );
              })}
              {plans.length > 0 && (
                <a href="#memberships" className="chip font-medium border-[#c8a86b]/40 text-[#c8a86b] hover:bg-[#c8a86b]/10 shadow-sm">
                  ✨ {t("servicesPage.memberships") !== "servicesPage.memberships" ? t("servicesPage.memberships") : "Memberships"}
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 space-y-24">
        {offline && (
          <p className="rounded-2xl border border-blush/30 bg-blush/10 px-6 py-4 text-sm text-blush font-medium text-center">
            Connect MongoDB and run <code className="text-gold font-bold">npm run seed</code> to load live studio services.
          </p>
        )}

        {/* Category Sections */}
        {categories.map((category) => {
          const categoryServices = services.filter((s) => s.category === category);
          const catObj = categoryMap[category];
          const categoryTitle =
            t(`servicesPage.categories.${category}`) !== `servicesPage.categories.${category}`
              ? t(`servicesPage.categories.${category}`)
              : catObj?.name || category;
          const categoryDesc =
            t(`servicesPage.categoryDescriptions.${category}`) !== `servicesPage.categoryDescriptions.${category}`
              ? t(`servicesPage.categoryDescriptions.${category}`)
              : catObj?.description || "";

          return (
            <section key={category} id={category} className="scroll-mt-28 space-y-8">
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border-color)] pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#c8a86b]">
                    {t("servicesPage.category") !== "servicesPage.category" ? t("servicesPage.category") : "Category"}
                  </span>
                  <h2 className="display text-3xl sm:text-4xl text-[var(--ink)] mt-1">
                    {categoryTitle}
                  </h2>
                  {categoryDesc && (
                    <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-xl">
                      {categoryDesc}
                    </p>
                  )}
                </div>
                <p className="text-xs text-[var(--ink-soft)] font-medium">
                  {categoryServices.length}{" "}
                  {categoryServices.length === 1
                    ? t("servicesPage.treatmentAvailable") !== "servicesPage.treatmentAvailable"
                      ? t("servicesPage.treatmentAvailable")
                      : "treatment available"
                    : t("servicesPage.treatmentsAvailable") !== "servicesPage.treatmentsAvailable"
                    ? t("servicesPage.treatmentsAvailable")
                    : "treatments available"}
                </p>
              </div>

              {/* Spacious 2-Column Luxury Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {categoryServices.map((service) => {
                  const localized = getLocalizedService(service, locale);
                  const rawPhotoUrl =
                    service.photos && service.photos.length > 0
                      ? service.photos[0]
                      : CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.general;

                  return (
                    <Reveal key={service._id}>
                      <div className="card group overflow-hidden border border-[var(--border-color)] hover:border-[#c8a86b]/40 transition-all flex flex-col justify-between h-full bg-[var(--card-bg)] shadow-sm hover:shadow-md rounded-2xl">
                        <div>
                          {/* Image Banner */}
                          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--background)]">
                            <Image
                              src={rawPhotoUrl}
                              alt={localized.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                              unoptimized={rawPhotoUrl.includes("digitaloceanspaces.com") || rawPhotoUrl.includes("verifik.co")}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)] via-transparent to-transparent opacity-80" />

                            <div className="absolute top-3 left-3 flex gap-2">
                              <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                                {categoryTitle}
                              </span>
                            </div>

                            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md border border-[#c8a86b]/30 text-[#c8a86b] text-xs font-semibold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                              <span>⏱</span>
                              <span>
                                {service.durationMin}{" "}
                                {t("servicesPage.mins") !== "servicesPage.mins" ? t("servicesPage.mins") : "mins"}
                              </span>
                            </div>
                          </div>

                          {/* Details Body */}
                          <div className="p-6 space-y-3">
                            <h3 className="display text-2xl text-[var(--ink)] group-hover:text-[#c8a86b] transition-colors">
                              {localized.name}
                            </h3>
                            <p className="text-xs leading-relaxed text-[var(--ink-soft)] line-clamp-3">
                              {localized.description}
                            </p>
                          </div>
                        </div>

                        {/* Footer & Pricing */}
                        <div className="p-6 pt-0 border-t border-[var(--border-color)]/50 mt-4 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] text-[var(--ink-soft)] uppercase font-semibold block">
                              {t("servicesPage.depositRequired") !== "servicesPage.depositRequired"
                                ? t("servicesPage.depositRequired")
                                : "Deposit Required:"}{" "}
                              {formatCad(service.depositCents)}
                            </span>
                            <span className="gold-text text-2xl font-bold">
                              {formatCad(service.priceCents)}
                            </span>
                          </div>

                          <Link
                            href={`/booking?serviceId=${service._id}`}
                            className="btn-primary text-xs !py-2.5 !px-5 shadow-sm hover:scale-105 transition-all"
                          >
                            {t("servicesPage.bookTreatment") !== "servicesPage.bookTreatment"
                              ? t("servicesPage.bookTreatment")
                              : "Book Treatment →"}
                          </Link>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Memberships Band */}
        {plans.length > 0 && (
          <div id="memberships" className="scroll-mt-28">
            <MembershipBand plans={plans as any} />
          </div>
        )}
      </div>
    </div>
  );
}
