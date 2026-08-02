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

const staticDictionaries: Record<Locale, any> = { en, tl, pa, ar, es };

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
  const [dbOverrides, setDbOverrides] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    const saved = localStorage.getItem("mari_locale") as Locale | null;
    if (saved && ["en", "tl", "pa", "ar", "es"].includes(saved)) {
      setLocaleState(saved);
      const targetDir = saved === "ar" ? "rtl" : "ltr";
      setDir(targetDir);
      document.documentElement.setAttribute("dir", targetDir);
      document.documentElement.setAttribute("lang", saved);
    }

    // Fetch dynamic translation overrides from MongoDB
    async function loadDbTranslations() {
      try {
        const res = await fetch("/api/public/translations");
        if (res.ok) {
          const data = await res.json();
          if (data.overrides) {
            setDbOverrides(data.overrides);
          }
        }
      } catch {
        // quiet fallback to static dictionaries
      }
    }
    void loadDbTranslations();
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
    // 1. Check MongoDB Overrides for active locale
    if (dbOverrides[locale] && dbOverrides[locale][keyPath]) {
      return dbOverrides[locale][keyPath];
    }

    // 2. Check Static JSON Dictionary for active locale
    const parts = keyPath.split(".");
    let current = staticDictionaries[locale] || staticDictionaries.en;
    let foundInLocale = true;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        foundInLocale = false;
        break;
      }
    }
    if (foundInLocale && typeof current === "string") {
      return current;
    }

    // 3. Fallback to MongoDB Overrides for English
    if (dbOverrides.en && dbOverrides.en[keyPath]) {
      return dbOverrides.en[keyPath];
    }

    // 4. Fallback to Static JSON Dictionary for English
    let fallback = staticDictionaries.en;
    for (const p of parts) {
      if (fallback && typeof fallback === "object" && p in fallback) {
        fallback = fallback[p];
      } else {
        return keyPath;
      }
    }

    return typeof fallback === "string" ? fallback : keyPath;
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
