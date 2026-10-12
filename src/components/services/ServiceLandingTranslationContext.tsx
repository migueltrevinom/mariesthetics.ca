"use client";

import React, { createContext, useContext } from "react";
import type { Locale } from "@/components/i18n/LanguageContext";

export type ServiceSlugByLocale = Partial<Record<Locale, string>>;

const ServiceLandingTranslationContext = createContext<ServiceSlugByLocale | null>(null);

export function ServiceLandingTranslationProvider({
  slugsByLocale,
  children,
}: {
  slugsByLocale: ServiceSlugByLocale;
  children: React.ReactNode;
}) {
  return (
    <ServiceLandingTranslationContext.Provider value={slugsByLocale}>
      {children}
    </ServiceLandingTranslationContext.Provider>
  );
}

export function useServiceLandingSlugs(): ServiceSlugByLocale | null {
  return useContext(ServiceLandingTranslationContext);
}
