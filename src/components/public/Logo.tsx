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

export function FullLogo({ className = "w-56 h-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 360"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mari Esthetics Full Logo"
    >
      <defs>
        <mask id="brandGutterFull">
          <rect width="400" height="360" fill="white" />
          <rect x="35" y="166" width="330" height="48" fill="black" />
        </mask>
      </defs>

      {/* Monogram M (Solid Black / Ink) */}
      <g mask="url(#brandGutterFull)" fill="currentColor">
        {/* Left stem with top-left flourish and bottom-left serif */}
        <path d="M 85 64 C 105 64 122 78 135 106 L 148 266 L 126 266 L 126 278 L 176 278 L 176 266 L 154 266 L 154 116 C 146 86 128 72 108 72 C 95 72 86 77 78 84 C 76 75 80 64 85 64 Z" />
        
        {/* Central V diagonals */}
        <path d="M 154 116 L 202 254 L 208 254 L 250 114 L 238 114 L 238 102 L 276 102 L 276 114 L 262 114 L 208 290 L 198 290 L 148 142 L 154 116 Z" />

        {/* Right stem with sweeping bottom-right tail flourish */}
        <path d="M 252 114 L 258 238 C 258 256 270 274 298 277 C 314 278 326 274 336 268 C 330 263 320 261 308 261 C 286 261 274 248 274 226 L 274 114 L 288 114 L 288 102 L 244 102 L 244 114 L 252 114 Z" />
      </g>

      {/* MARI ESTHETICS Text across waist in pure solid black / ink */}
      <text
        x="200"
        y="196"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Manrope', 'Montserrat', sans-serif"
        fontSize="21"
        fontWeight="700"
        letterSpacing="0.38em"
        fill="currentColor"
      >
        MARI ESTHETICS
      </text>

      {/* PMU • FACIALS • LASHES below M in pure solid black / ink */}
      <text
        x="200"
        y="325"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Manrope', 'Montserrat', sans-serif"
        fontSize="11.5"
        fontWeight="500"
        letterSpacing="0.32em"
        fill="currentColor"
      >
        PMU • FACIALS • LASHES
      </text>
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
      <span className={`inline-flex items-center text-[var(--ink)] ${className}`}>
        <MonogramIcon className={iconSizes[size]} />
      </span>
    );
  }

  // Full stacked emblem logo (exact brand layout)
  if (variant === "full") {
    const fullSizes = {
      sm: "w-40 sm:w-48",
      md: "w-48 sm:w-56",
      lg: "w-56 sm:w-64",
      xl: "w-64 sm:w-72",
    };

    return (
      <div className={`inline-flex flex-col items-start select-none group text-[var(--ink)] ${className}`}>
        <FullLogo className={`${fullSizes[size]} h-auto text-[var(--ink)]`} />
        {tagline && (
          <span className="mt-2 text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-[var(--ink-soft)]">
            Edmonton, Alberta
          </span>
        )}
      </div>
    );
  }

  // Default: Horizontal clean header lockup in pure black / ink
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none text-[var(--ink)] ${className}`}>
      {/* Luxury Monogram M Icon in Black / Ink */}
      <span className="text-[var(--ink)] shrink-0 group-hover:opacity-80 transition-opacity">
        <MonogramIcon className={iconSizes[size]} />
      </span>

      {/* Brand Name Typography */}
      <div className="flex flex-col justify-center leading-none">
        <span
          className={`font-[family-name:var(--font-body)] font-bold uppercase text-[var(--ink)] ${textSizes[size]}`}
        >
          Mari&nbsp;Esthetics
        </span>
        {(subtitle || tagline) && (
          <span className="mt-1 text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.24em] text-[var(--ink-soft)]">
            {tagline ? "Edmonton Studio" : "PMU • Facials • Lashes"}
          </span>
        )}
      </div>
    </div>
  );
}
