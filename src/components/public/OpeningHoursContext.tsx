"use client";

import { createContext, useContext } from "react";
import type { HoursLine } from "@/lib/hoursDisplay";
import { useLanguage } from "@/components/i18n/LanguageContext";

type ByLocale = Record<string, HoursLine[]>;

const OpeningHoursContext = createContext<ByLocale>({});

/** Hands the admin weekly schedule (read and formatted on the server) to client UI. */
export function OpeningHoursProvider({
  linesByLocale,
  children,
}: {
  linesByLocale: ByLocale;
  children: React.ReactNode;
}) {
  return <OpeningHoursContext.Provider value={linesByLocale}>{children}</OpeningHoursContext.Provider>;
}

/** Localized hours lines from the backend schedule; empty when unknown (hide the block). */
export function useOpeningHoursLines(): HoursLine[] {
  const byLocale = useContext(OpeningHoursContext);
  const { locale } = useLanguage();
  return byLocale[locale] ?? byLocale.en ?? [];
}
