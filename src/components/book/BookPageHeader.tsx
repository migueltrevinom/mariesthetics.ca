"use client";

import { useLanguage } from "@/components/i18n/LanguageContext";

export function BookPageHeader() {
  const { t } = useLanguage();

  return (
    <div className="text-center sm:text-left space-y-3 mb-10">
      <p className="eyebrow">
        {t("bookingWizard.eyebrow") !== "bookingWizard.eyebrow"
          ? t("bookingWizard.eyebrow")
          : "Online Reservation"}
      </p>
      <h1 className="display text-4xl sm:text-5xl md:text-7xl text-[var(--ink)] tracking-tight">
        {t("bookingWizard.title") !== "bookingWizard.title"
          ? t("bookingWizard.title")
          : "Reserve Your Treatment."}
      </h1>
      <p className="max-w-2xl text-sm sm:text-base text-[var(--ink-soft)] leading-relaxed">
        {t("bookingWizard.subtitle") !== "bookingWizard.subtitle"
          ? t("bookingWizard.subtitle")
          : "Select your service, choose a date & time slot, and secure your session with a deposit. Instant confirmation with Debit or Credit Card, or held for 2 hours with Interac e-Transfer."}
      </p>
    </div>
  );
}
