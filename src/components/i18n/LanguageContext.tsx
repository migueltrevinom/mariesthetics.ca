"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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

// Optimization: Pre-flatten static JSON dictionaries at module load time into keyPath -> string maps.
// This turns nested translation key resolutions from O(depth) string splits and object traversals
// into O(1) dictionary lookups without string array allocations during rendering.
function flattenDictionary(obj: Record<string, any>, prefix = ""): Record<string, string> {
  const flattened: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(flattened, flattenDictionary(value, fullKey));
      } else if (typeof value === "string") {
        flattened[fullKey] = value;
      }
    }
  }
  return flattened;
}

const flattenedStaticDictionaries: Record<Locale, Record<string, string>> = {
  en: flattenDictionary(en),
  tl: flattenDictionary(tl),
  pa: flattenDictionary(pa),
  ar: flattenDictionary(ar),
  es: flattenDictionary(es),
};

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

  const t = useCallback(
    (keyPath: string): string => {
      // 1. Check MongoDB Overrides for active locale
      const activeDb = dbOverrides[locale];
      if (activeDb && activeDb[keyPath]) {
        return activeDb[keyPath];
      }

      // 2. Check pre-flattened Static JSON Dictionary for active locale (O(1) lookup)
      const activeDict = flattenedStaticDictionaries[locale] || flattenedStaticDictionaries.en;
      if (activeDict && typeof activeDict[keyPath] === "string") {
        return activeDict[keyPath];
      }

      // 3. Fallback to MongoDB Overrides for English
      const enDb = dbOverrides.en;
      if (enDb && typeof enDb[keyPath] === "string") {
        return enDb[keyPath];
      }

      // 4. Fallback to pre-flattened Static JSON Dictionary for English
      const enDict = flattenedStaticDictionaries.en;
      if (enDict && typeof enDict[keyPath] === "string") {
        return enDict[keyPath];
      }

      return keyPath;
    },
    [locale, dbOverrides]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
