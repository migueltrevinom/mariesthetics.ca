"use client";

import React, { createContext, useContext } from "react";
import type { Locale } from "@/components/i18n/LanguageContext";

export type BlogSlugByLocale = Partial<Record<Locale, string>>;

const BlogTranslationContext = createContext<BlogSlugByLocale | null>(null);

export function BlogTranslationProvider({
  slugsByLocale,
  children,
}: {
  slugsByLocale: BlogSlugByLocale;
  children: React.ReactNode;
}) {
  return (
    <BlogTranslationContext.Provider value={slugsByLocale}>
      {children}
    </BlogTranslationContext.Provider>
  );
}

export function useBlogTranslationSlugs(): BlogSlugByLocale | null {
  return useContext(BlogTranslationContext);
}
