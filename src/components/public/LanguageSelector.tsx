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
        style={{
          backgroundColor: "var(--card-bg)",
          color: "var(--ink)",
          borderColor: "var(--border-color)",
        }}
        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full border hover:border-[#c8a86b] transition-all shadow-sm select-none"
        aria-label="Select Language"
      >
        <span className="text-sm">{currentLang.flag}</span>
        <span className="tracking-wide">{currentLang.label}</span>
        <svg
          className="w-3.5 h-3.5 opacity-70 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--ink)",
            borderColor: "var(--border-color)",
          }}
          className="absolute right-0 ltr:right-0 rtl:left-0 mt-2 w-48 rounded-2xl border shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <div
            style={{ borderColor: "var(--border-color)", color: "var(--ink-soft)" }}
            className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider border-b opacity-80"
          >
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
                style={{
                  backgroundColor: isSelected ? "rgba(200, 168, 107, 0.18)" : "transparent",
                  color: isSelected ? "#c8a86b" : "var(--ink)",
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-[#c8a86b]/15"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-sm">{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {isSelected && (
                  <span className="text-[#c8a86b] font-bold">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
