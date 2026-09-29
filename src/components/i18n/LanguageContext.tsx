"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
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

// ⚡ Performance Optimization (Bolt):
// Flatten nested JSON dictionaries once at module load time into flat dot-notation key lookup maps.
// This turns nested object key splitting (keyPath.split(".")) and runtime property traversals into O(1) constant-time direct object property lookups on every translation call.
function flattenDictionary(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const flattened: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, flattenDictionary(value as Record<string, unknown>, newKey));
      } else if (typeof value === "string") {
        flattened[newKey] = value;
      }
    }
  }
  return flattened;
}

const flatStaticDictionaries: Record<Locale, Record<string, string>> = {
  en: flattenDictionary(en as Record<string, unknown>),
  tl: flattenDictionary(tl as Record<string, unknown>),
  pa: flattenDictionary(pa as Record<string, unknown>),
  ar: flattenDictionary(ar as Record<string, unknown>),
  es: flattenDictionary(es as Record<string, unknown>),
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

  // ⚡ Performance Optimization (Bolt):
  // Memoize setLocale with useCallback to preserve reference across renders.
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("mari_locale", newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    const targetDir = newLocale === "ar" ? "rtl" : "ltr";
    setDir(targetDir);
    document.documentElement.setAttribute("dir", targetDir);
    document.documentElement.setAttribute("lang", newLocale);
  }, []);

  // ⚡ Performance Optimization (Bolt):
  // Memoize `t` function reference with useCallback and leverage pre-flattened flatStaticDictionaries.
  const t = useCallback(
    (keyPath: string): string => {
      // 1. Check MongoDB Overrides for active locale
      if (dbOverrides[locale] && dbOverrides[locale][keyPath]) {
        return dbOverrides[locale][keyPath];
      }

      // 2. Check pre-flattened Static JSON Dictionary for active locale (O(1) lookup)
      const activeDict = flatStaticDictionaries[locale] || flatStaticDictionaries.en;
      if (activeDict[keyPath] !== undefined) {
        return activeDict[keyPath];
      }

      // 3. Fallback to MongoDB Overrides for English
      if (dbOverrides.en && dbOverrides.en[keyPath]) {
        return dbOverrides.en[keyPath];
      }

      // 4. Fallback to pre-flattened Static JSON Dictionary for English (O(1) lookup)
      const enDict = flatStaticDictionaries.en;
      if (enDict[keyPath] !== undefined) {
        return enDict[keyPath];
      }

      return keyPath;
    },
    [locale, dbOverrides]
  );

  // ⚡ Performance Optimization (Bolt):
  // Memoize context value object so consumers (MegaMenu, SiteHeader, etc.) do not re-render unnecessarily when LanguageProvider re-renders.
  const contextValue = useMemo(
    () => ({ locale, setLocale, t, dir }),
    [locale, setLocale, t, dir]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
