"use client";

import React from "react";

export function MonogramIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left curved flourish & left vertical stem */}
      <path d="M 16 22 C 22 22 28 27 32 37 L 36 71 L 28 71 L 28 75 L 45 75 L 45 71 L 37 71 L 37 40 L 51 63 L 55 63 L 69 38 L 69 62 C 69 68 73 73 81 74 C 83 74 85 73 86 72 C 85 71 82 71 80 71 C 75 71 72 67 72 60 L 72 36 L 77 36 L 77 32 L 64 32 L 64 36 L 68 36 L 53 60 L 38 33 L 28 33 C 24 26 20 22 16 22 Z" />
    </svg>
  );
}

export function Logo({
  size = "md",
  variant = "horizontal",
  tagline = false,
  subtitle = false,
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "horizontal" | "full" | "mark";
  tagline?: boolean;
  subtitle?: boolean;
  className?: string;
}) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-xs md:text-sm tracking-[0.28em]",
    md: "text-sm md:text-base tracking-[0.32em]",
    lg: "text-base md:text-lg tracking-[0.36em]",
    xl: "text-lg md:text-xl tracking-[0.4em]",
  };

  // Pure icon mark only
  if (variant === "mark") {
    return (
      <span className={`inline-flex items-center text-[#c8a86b] ${className}`}>
        <MonogramIcon className={iconSizes[size]} />
      </span>
    );
  }

  // Full stacked emblem (matching the luxury brand card for footer / hero)
  if (variant === "full") {
    return (
      <div className={`inline-flex flex-col items-start select-none group ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-[#c8a86b] group-hover:scale-105 transition-transform duration-300">
            <MonogramIcon className={iconSizes[size]} />
          </span>
          <div className="flex flex-col">
            <span
              className={`font-[family-name:var(--font-body)] font-bold uppercase text-[var(--ink)] ${textSizes[size]}`}
            >
              Mari&nbsp;Esthetics
            </span>
            <span className="text-[9px] md:text-[10px] font-medium tracking-[0.26em] text-[var(--ink-soft)] uppercase mt-0.5">
              PMU • Facials • Lashes
            </span>
          </div>
        </div>
        {tagline && (
          <span className="mt-2 text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-[#c8a86b]">
            Edmonton, Alberta
          </span>
        )}
      </div>
    );
  }

  // Default: Horizontal clean header lockup
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none group ${className}`}>
      {/* Luxury Monogram M Icon */}
      <span className="text-[#c8a86b] shrink-0 group-hover:scale-105 transition-transform duration-300">
        <MonogramIcon className={iconSizes[size]} />
      </span>

      {/* Brand Name Typography */}
      <div className="flex flex-col justify-center leading-none">
        <span
          className={`font-[family-name:var(--font-body)] font-bold uppercase text-[var(--ink)] transition-colors group-hover:text-[#c8a86b] ${textSizes[size]}`}
        >
          Mari&nbsp;Esthetics
        </span>
        {(subtitle || tagline) && (
          <span className="mt-1 text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.24em] text-[#c8a86b]">
            {tagline ? "Edmonton Studio" : "PMU • Facials • Lashes"}
          </span>
        )}
      </div>
    </div>
  );
}
