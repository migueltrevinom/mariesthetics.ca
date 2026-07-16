"use client";

import { useEffect, useState } from "react";

type Theme = "auto" | "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("auto");

  // Read theme on mount
  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as Theme) || "auto";
    setTheme(savedTheme);
  }, []);

  // Update theme in localStorage & DOM
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const applyTheme = (t: "light" | "dark") => {
      if (t === "light") {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    };

    if (newTheme === "auto") {
      const isSystemLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      applyTheme(isSystemLight ? "light" : "dark");
    } else {
      applyTheme(newTheme);
    }
  };

  return (
    <div className="mt-6 w-full">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--ink-soft)] font-bold mb-2 text-left px-1">
        Appearance
      </p>
      <div className="flex bg-black/[0.03] dark:bg-black/25 border border-[var(--border-color)] p-1 rounded-xl w-full text-xs font-medium relative shadow-inner">
        {/* Light Option */}
        <button
          type="button"
          onClick={() => handleThemeChange("light")}
          className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${
            theme === "light"
              ? "bg-white dark:bg-white/[0.06] text-[var(--ink)] border border-[var(--border-color)] shadow-sm font-semibold"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
          title="Light Mode"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
          <span>Light</span>
        </button>

        {/* Auto Option */}
        <button
          type="button"
          onClick={() => handleThemeChange("auto")}
          className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${
            theme === "auto"
              ? "bg-white dark:bg-white/[0.06] text-[var(--ink)] border border-[var(--border-color)] shadow-sm font-semibold"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
          title="System Sync"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Auto</span>
        </button>

        {/* Dark Option */}
        <button
          type="button"
          onClick={() => handleThemeChange("dark")}
          className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${
            theme === "dark"
              ? "bg-white dark:bg-white/[0.06] text-[var(--ink)] border border-[var(--border-color)] shadow-sm font-semibold"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
          title="Dark Mode"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span>Dark</span>
        </button>
      </div>
    </div>
  );
}
