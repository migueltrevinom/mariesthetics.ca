"use client";

import Link from "next/link";
import { whatsappUrl } from "@/lib/config";
import { business, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();
  const href = whatsappUrl(
    "Hi Mari! I’d like to get in touch about Mari Esthetics."
  );

  return (
    <div className="aurora grain relative min-h-[90svh] overflow-hidden pt-40 pb-24 md:pt-48 bg-[var(--background)] text-[var(--foreground)]">
      <div className="relative mx-auto max-w-3xl px-6 text-center md:px-10">
        <p className="reveal eyebrow">
          {t("contactPage.eyebrow") !== "contactPage.eyebrow"
            ? t("contactPage.eyebrow")
            : "Contact"}
        </p>
        <h1 className="reveal reveal-delay-1 display mt-5 text-5xl text-[var(--ink)] md:text-7xl">
          {t("contactPage.title") !== "contactPage.title"
            ? t("contactPage.title")
            : "Let’s talk skin."}
        </h1>
        <p className="reveal reveal-delay-2 mx-auto mt-6 max-w-md text-[var(--ink-soft)] leading-relaxed">
          {t("contactPage.subtitle") !== "contactPage.subtitle"
            ? t("contactPage.subtitle")
            : "The quickest way to reach Mari is WhatsApp. For appointments, booking online is fastest — your deposit locks the time instantly."}
        </p>

        <div className="reveal reveal-delay-3 mt-10 flex flex-wrap justify-center gap-4">
          <a href={href} target="_blank" rel="noreferrer" className="btn-primary">
            {t("contactPage.whatsappBtn") !== "contactPage.whatsappBtn"
              ? t("contactPage.whatsappBtn")
              : "Message on WhatsApp"}
          </a>
          <Link href="/book" className="btn-ghost">
            {t("contactPage.bookBtn") !== "contactPage.bookBtn"
              ? t("contactPage.bookBtn")
              : "Book an appointment"}
          </Link>
        </div>

        <div className="mx-auto mt-16 grid max-w-xl gap-4 sm:grid-cols-3">
          <div className="card p-6 border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
            <p className="eyebrow">
              {t("contactPage.whatsappEyebrow") !== "contactPage.whatsappEyebrow"
                ? t("contactPage.whatsappEyebrow")
                : "WhatsApp"}
            </p>
            <p className="mt-3 text-sm text-[var(--ink)] font-semibold">{business.phoneDisplay}</p>
          </div>
          <div className="card p-6 border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
            <p className="eyebrow">
              {t("contactPage.hoursEyebrow") !== "contactPage.hoursEyebrow"
                ? t("contactPage.hoursEyebrow")
                : "Hours"}
            </p>
            <p className="mt-3 text-sm text-[var(--ink)] font-semibold">
              {t("contactPage.hoursValue") !== "contactPage.hoursValue"
                ? t("contactPage.hoursValue")
                : "Tue – Sat"}
            </p>
            <p className="text-sm text-[var(--ink-soft)]">
              {t("contactPage.hoursTime") !== "contactPage.hoursTime"
                ? t("contactPage.hoursTime")
                : "9:00 am – 6:00 pm"}
            </p>
          </div>
          <div className="card p-6 border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
            <p className="eyebrow">
              {t("contactPage.areaEyebrow") !== "contactPage.areaEyebrow"
                ? t("contactPage.areaEyebrow")
                : "Service Area"}
            </p>
            <p className="mt-3 text-sm text-[var(--ink)] font-semibold">
              {business.locality}, {business.region}
            </p>
            <p className="text-sm text-[var(--ink-soft)]">
              {t("contactPage.surroundingArea") !== "contactPage.surroundingArea"
                ? t("contactPage.surroundingArea")
                : "& surrounding area"}
            </p>
          </div>
        </div>

        <p className="mt-10 text-xs text-[var(--ink-soft)] opacity-80">
          {t("contactPage.privateStudioNote") !== "contactPage.privateStudioNote"
            ? t("contactPage.privateStudioNote")
            : "Private home studio — the exact address is shared once your appointment is confirmed."}
        </p>
      </div>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
    </div>
  );
}
