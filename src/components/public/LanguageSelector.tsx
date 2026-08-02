"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage, LANGUAGES, Locale } from "@/components/i18n/LanguageContext";

export function LanguageSelector() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--ink)] hover:border-[#c8a86b] transition-all shadow-sm select-none"
        aria-label="Select Language"
      >
        <span className="text-sm">{currentLang.flag}</span>
        <span className="tracking-wide">{currentLang.label}</span>
        <svg
          className={`w-3.5 h-3.5 text-[var(--ink-soft)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 ltr:right-0 rtl:left-0 mt-2 w-48 rounded-2xl border border-[#c8a86b]/40 bg-[#0d1310] dark:bg-[#0a0f0c] light:bg-white text-[var(--ink)] shadow-2xl z-50 py-2 backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold text-[var(--ink-soft)] tracking-wider border-b border-[var(--border-color)]">
            Select Language
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === locale;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLocale(lang.code as Locale);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                  isSelected
                    ? "bg-[#c8a86b]/15 font-bold text-[#c8a86b]"
                    : "text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {isSelected && (
                  <span className="text-[#c8a86b]">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
