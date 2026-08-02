"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "@/messages/en.json";
import tl from "@/messages/tl.json";
import pa from "@/messages/pa.json";
import ar from "@/messages/ar.json";
import es from "@/messages/es.json";

export type Locale = "en" | "tl" | "pa" | "ar" | "es";

export interface LanguageOption {
  code: Locale;
  label: string;
  flag: string;
  dir: "ltr" | "rtl";
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", flag: "🇨🇦", dir: "ltr" },
  { code: "tl", label: "Tagalog", flag: "🇵🇭", dir: "ltr" },
  { code: "pa", label: "ਪੰਜਾਬੀ", flag: "🇮🇳", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "es", label: "Español", flag: "🇲🇽", dir: "ltr" },
];

const dictionaries: Record<Locale, any> = { en, tl, pa, ar, es };

interface LanguageContextType {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  t: (keyPath: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  t: (keyPath: string) => keyPath,
  dir: "ltr",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");

  useEffect(() => {
    const saved = localStorage.getItem("mari_locale") as Locale | null;
    if (saved && ["en", "tl", "pa", "ar", "es"].includes(saved)) {
      setLocaleState(saved);
      const targetDir = saved === "ar" ? "rtl" : "ltr";
      setDir(targetDir);
      document.documentElement.setAttribute("dir", targetDir);
      document.documentElement.setAttribute("lang", saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("mari_locale", newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    const targetDir = newLocale === "ar" ? "rtl" : "ltr";
    setDir(targetDir);
    document.documentElement.setAttribute("dir", targetDir);
    document.documentElement.setAttribute("lang", newLocale);
  };

  const t = (keyPath: string): string => {
    const parts = keyPath.split(".");
    let current = dictionaries[locale] || dictionaries.en;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        // Fallback to English dictionary if key is missing in active locale
        let fallback = dictionaries.en;
        for (const p of parts) {
          if (fallback && typeof fallback === "object" && p in fallback) {
            fallback = fallback[p];
          } else {
            return keyPath;
          }
        }
        return typeof fallback === "string" ? fallback : keyPath;
      }
    }
    return typeof current === "string" ? current : keyPath;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
