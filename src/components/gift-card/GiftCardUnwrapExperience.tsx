"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ConfettiEffect } from "@/components/ui/ConfettiEffect";

export interface GiftCardData {
  code: string;
  initialBalanceCents: number;
  remainingBalanceCents: number;
  amountCad: number;
  initialAmountCad: number;
  recipientName: string;
  senderName: string;
  message: string;
  expiryDate?: string | null;
  isExpired?: boolean;
  createdAt?: string;
}

interface GiftCardUnwrapExperienceProps {
  giftCard: GiftCardData;
}

export function GiftCardUnwrapExperience({ giftCard }: GiftCardUnwrapExperienceProps) {
  const [isUnwrapped, setIsUnwrapped] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gentle interactive hover tilt
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(y / (rect.height / 2)) * 6,
      y: (x / (rect.width / 2)) * 6,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleUnwrap = () => {
    if (isOpening || isUnwrapped) return;
    setIsOpening(true);

    setTimeout(() => {
      setIsUnwrapped(true);
      setIsOpening(false);
    }, 800);
  };

  const handleWrapAgain = () => {
    setIsUnwrapped(false);
    setIsOpening(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(giftCard.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 sm:py-20 bg-gradient-to-b from-[#0b140f] via-[#070d0a] to-[#040605] text-[#f3efe6] overflow-hidden select-none"
    >
      {/* ── WARM CELEBRATION AMBIENCE (NOT SPACE!) ── */}
      {/* Warm Golden Glow Behind Box */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-0 print:hidden">
        <div className="w-[600px] h-[600px] rounded-full bg-radial from-[#c8a86b]/15 via-[#856526]/5 to-transparent blur-3xl" />
      </div>

      {/* Celebratory Floating Confetti when opened */}
      {isUnwrapped && (
        <ConfettiEffect
          count={70}
          colors={["#c8a86b", "#e2c78c", "#ffffff", "#2f6b50", "#f5dfb8"]}
        />
      )}

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center">

        {/* ── STAGE 1: THE GORGEOUS PRESENT BOX (BEFORE UNWRAPPING) ── */}
        {!isUnwrapped && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
            {/* Header Eyebrow & Title */}
            <div className="mb-6 space-y-2">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#c8a86b] px-3.5 py-1 rounded-full border border-[#c8a86b]/30 bg-[#c8a86b]/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c8a86b]" />
                <span>Special Gift Delivery</span>
              </span>
              <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl text-[#f3efe6] font-normal tracking-tight">
                You’ve Received a Gift!
              </h1>
              <p className="text-xs sm:text-sm text-[#f3efe6]/70 max-w-md mx-auto">
                With warmest wishes from <strong className="text-[#f3efe6] font-semibold">{giftCard.senderName}</strong>
                {giftCard.recipientName ? (
                  <> for <strong className="text-[#f3efe6] font-semibold">{giftCard.recipientName}</strong></>
                ) : ""}
              </p>
            </div>

            {/* ── THE PRESENT BOX CONTAINER ── */}
            <div
              ref={containerRef}
              onClick={handleUnwrap}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: "transform 0.15s ease-out",
              }}
              className="relative w-80 h-76 sm:w-92 sm:h-84 my-2 cursor-pointer group flex items-center justify-center"
            >
              {/* Floor Shadow Under Box */}
              <div className="absolute -bottom-6 w-64 h-12 rounded-full bg-black/80 blur-xl pointer-events-none group-hover:scale-105 transition-transform duration-300" />

              {/* ── ISOMETRIC LUXURY PRESENT BOX SVG ── */}
              <svg
                viewBox="0 0 340 320"
                className="w-full h-full drop-shadow-[0_25px_35px_rgba(0,0,0,0.8)] overflow-visible"
              >
                <defs>
                  {/* Left Face Shaded Emerald */}
                  <linearGradient id="boxLeftGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#13281c" />
                    <stop offset="50%" stopColor="#0c1912" />
                    <stop offset="100%" stopColor="#060c09" />
                  </linearGradient>

                  {/* Right Face Lit Emerald */}
                  <linearGradient id="boxRightGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#224732" />
                    <stop offset="50%" stopColor="#163122" />
                    <stop offset="100%" stopColor="#0d1c14" />
                  </linearGradient>

                  {/* Interior Velvet Glow */}
                  <radialGradient id="interiorGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fce8be" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#c8a86b" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0b1710" stopOpacity="1" />
                  </radialGradient>

                  {/* Metallic Gold Ribbon Left */}
                  <linearGradient id="goldRibbonLeft" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8a6b2b" />
                    <stop offset="45%" stopColor="#fce7b8" />
                    <stop offset="70%" stopColor="#dfbf7a" />
                    <stop offset="100%" stopColor="#7a5d24" />
                  </linearGradient>

                  {/* Metallic Gold Ribbon Right (Bright) */}
                  <linearGradient id="goldRibbonRight" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a37f34" />
                    <stop offset="40%" stopColor="#fff3d1" />
                    <stop offset="75%" stopColor="#e5c580" />
                    <stop offset="100%" stopColor="#8a6b2b" />
                  </linearGradient>

                  {/* Ribbon Bow Gradient */}
                  <linearGradient id="bowGoldGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fff6db" />
                    <stop offset="35%" stopColor="#e5c580" />
                    <stop offset="70%" stopColor="#c8a86b" />
                    <stop offset="100%" stopColor="#7a5d24" />
                  </linearGradient>

                  {/* Lid Top Face */}
                  <linearGradient id="lidTopGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2b5a3f" />
                    <stop offset="60%" stopColor="#1a3b2a" />
                    <stop offset="100%" stopColor="#10251a" />
                  </linearGradient>

                  {/* Drop Shadow Filter */}
                  <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.6" />
                  </filter>
                </defs>

                {/* ── 1. BOX BASE (HOLLOW INTERIOR + FACES) ── */}
                <g id="box-base">
                  {/* Glowing Interior Cavity (Seen when lid is off) */}
                  <polygon
                    points="170,145 70,95 170,45 270,95"
                    fill="url(#interiorGlow)"
                    stroke="#c8a86b"
                    strokeWidth="1.5"
                  />

                  {/* Light Beams from inside box when opening */}
                  {isOpening && (
                    <polygon
                      points="170,145 70,95 90,0 250,0 270,95"
                      fill="url(#interiorGlow)"
                      opacity="0.6"
                      className="animate-pulse"
                    />
                  )}

                  {/* Left Face */}
                  <polygon
                    points="170,270 70,220 70,95 170,145"
                    fill="url(#boxLeftGrad)"
                    stroke="#c8a86b"
                    strokeWidth="1"
                    strokeOpacity="0.4"
                  />

                  {/* Left Face Vertical Ribbon */}
                  <polygon
                    points="110,115 130,125 130,250 110,240"
                    fill="url(#goldRibbonLeft)"
                  />

                  {/* Left Face Horizontal Ribbon */}
                  <polygon
                    points="70,150 170,200 170,220 70,170"
                    fill="url(#goldRibbonLeft)"
                  />

                  {/* Right Face (Lit) */}
                  <polygon
                    points="170,270 270,220 270,95 170,145"
                    fill="url(#boxRightGrad)"
                    stroke="#c8a86b"
                    strokeWidth="1"
                    strokeOpacity="0.5"
                  />

                  {/* Right Face Vertical Ribbon */}
                  <polygon
                    points="210,125 230,115 230,240 210,250"
                    fill="url(#goldRibbonRight)"
                  />

                  {/* Right Face Horizontal Ribbon */}
                  <polygon
                    points="170,200 270,150 270,170 170,220"
                    fill="url(#goldRibbonRight)"
                  />

                  {/* Gold Corner Edges & Ridge Line */}
                  <line x1="170" y1="270" x2="170" y2="145" stroke="#fff3d1" strokeWidth="1.5" opacity="0.6" />
                  <line x1="70" y1="220" x2="170" y2="270" stroke="#c8a86b" strokeWidth="1" opacity="0.4" />
                  <line x1="170" y1="270" x2="270" y2="220" stroke="#c8a86b" strokeWidth="1" opacity="0.6" />

                  {/* Center Golden Medallion */}
                  <circle cx="170" cy="210" r="14" fill="#08100c" stroke="#c8a86b" strokeWidth="1.5" />
                  <text x="170" y="214" textAnchor="middle" fill="#fae7b9" fontSize="10" fontWeight="bold" fontFamily="serif">
                    M
                  </text>

                  {/* Hanging Calligraphy Gift Tag */}
                  <g transform="translate(205, 175) rotate(-6)">
                    {/* Golden string */}
                    <line x1="-10" y1="-25" x2="0" y2="0" stroke="#c8a86b" strokeWidth="1.5" />
                    {/* Tag Card */}
                    <rect
                      x="-8"
                      y="0"
                      width="75"
                      height="46"
                      rx="6"
                      fill="#faf7ee"
                      stroke="#c8a86b"
                      strokeWidth="1.5"
                      filter="url(#softShadow)"
                    />
                    <text x="29" y="13" textAnchor="middle" fill="#8a6b2b" fontSize="7" fontWeight="bold" letterSpacing="1">
                      FOR YOU
                    </text>
                    <text x="29" y="26" textAnchor="middle" fill="#12241c" fontSize="10" fontWeight="bold">
                      {giftCard.recipientName.split(" ")[0] || "Valued Client"}
                    </text>
                    <text x="29" y="38" textAnchor="middle" fill="#8a6b2b" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      ${giftCard.amountCad.toFixed(2)} CAD
                    </text>
                  </g>
                </g>

                {/* ── 2. THE DETACHABLE 3D LID & SILK BOW (ANIMATES UPWARD) ── */}
                <g
                  id="box-lid-assembly"
                  style={{
                    transform: isOpening
                      ? "translateY(-130px) rotate(-14deg) scale(0.95)"
                      : "translateY(0px) rotate(0deg)",
                    opacity: isOpening ? 0 : 1,
                    transition: isOpening
                      ? "transform 0.8s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.75s ease"
                      : "transform 0.4s ease",
                    transformOrigin: "170px 100px",
                  }}
                  className={!isOpening ? "group-hover:-translate-y-2 transition-transform duration-300" : ""}
                >
                  {/* Lid Left Skirt */}
                  <polygon
                    points="170,165 60,110 60,85 170,140"
                    fill="#0f2218"
                    stroke="#c8a86b"
                    strokeWidth="1"
                    strokeOpacity="0.5"
                  />
                  {/* Lid Left Skirt Ribbon */}
                  <polygon
                    points="102,106 124,117 124,142 102,131"
                    fill="url(#goldRibbonLeft)"
                  />

                  {/* Lid Right Skirt */}
                  <polygon
                    points="170,165 280,110 280,85 170,140"
                    fill="#183625"
                    stroke="#c8a86b"
                    strokeWidth="1"
                    strokeOpacity="0.6"
                  />
                  {/* Lid Right Skirt Ribbon */}
                  <polygon
                    points="216,117 238,106 238,131 216,142"
                    fill="url(#goldRibbonRight)"
                  />

                  {/* Lid Top Face Diamond */}
                  <polygon
                    points="170,140 60,85 170,30 280,85"
                    fill="url(#lidTopGrad)"
                    stroke="#c8a86b"
                    strokeWidth="1.5"
                    filter="url(#softShadow)"
                  />

                  {/* Lid Top Face Ribbon (Diagonal Crossing) */}
                  <polygon
                    points="103,51 127,63 237,118 213,106"
                    fill="url(#goldRibbonRight)"
                    opacity="0.9"
                  />
                  <polygon
                    points="213,51 237,63 127,118 103,106"
                    fill="url(#goldRibbonRight)"
                    opacity="0.9"
                  />

                  {/* ── THE GORGEOUS SILK RIBBON BOW ON TOP ── */}
                  <g id="ribbon-bow" transform="translate(170, 75)">
                    {/* Left Bow Loop */}
                    <path
                      d="M 0,0 C -35,-25 -65,-20 -55,0 C -45,15 -15,10 0,0 Z"
                      fill="url(#bowGoldGrad)"
                      stroke="#8a6b2b"
                      strokeWidth="1"
                      filter="url(#softShadow)"
                    />
                    <path
                      d="M -5,-2 C -30,-20 -50,-15 -42,-2 C -35,8 -12,6 -5,-2 Z"
                      fill="#8a6b2b"
                      opacity="0.35"
                    />

                    {/* Right Bow Loop */}
                    <path
                      d="M 0,0 C 35,-25 65,-20 55,0 C 45,15 15,10 0,0 Z"
                      fill="url(#bowGoldGrad)"
                      stroke="#8a6b2b"
                      strokeWidth="1"
                      filter="url(#softShadow)"
                    />
                    <path
                      d="M 5,-2 C 30,-20 50,-15 42,-2 C 35,8 12,6 5,-2 Z"
                      fill="#8a6b2b"
                      opacity="0.35"
                    />

                    {/* Left Flowing Ribbon Tail */}
                    <path
                      d="M -6,5 C -25,25 -35,50 -45,65 C -35,55 -25,35 0,10 Z"
                      fill="url(#bowGoldGrad)"
                      opacity="0.9"
                    />

                    {/* Right Flowing Ribbon Tail */}
                    <path
                      d="M 6,5 C 25,25 35,50 45,65 C 35,55 25,35 0,10 Z"
                      fill="url(#bowGoldGrad)"
                      opacity="0.9"
                    />

                    {/* Center Satin Bow Knot */}
                    <ellipse
                      cx="0"
                      cy="0"
                      rx="11"
                      ry="8"
                      fill="url(#bowGoldGrad)"
                      stroke="#8a6b2b"
                      strokeWidth="1"
                      filter="url(#softShadow)"
                    />
                    <circle cx="0" cy="0" r="4" fill="#6d5420" opacity="0.3" />
                  </g>
                </g>
              </svg>
            </div>

            {/* Tap to Open Prompt */}
            <div className="mt-6 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={handleUnwrap}
                className="group h-11 px-6 rounded-full bg-[#c8a86b] hover:bg-[#d8b87b] text-[#0b140f] text-xs font-semibold tracking-wider uppercase transition-all duration-150 active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
              >
                <span>Open Gift Box</span>
                <svg className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>

              <span className="text-[11px] text-[#f3efe6]/50 font-light tracking-wide">
                Click anywhere on the gift box to unwrap
              </span>
            </div>
          </div>
        )}

        {/* ── STAGE 2: UNWRAPPED LUXURY GIFT CERTIFICATE (CARD REVEAL) ── */}
        {isUnwrapped && (
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 fade-in duration-700">
            {/* Top Status */}
            <div className="mb-5 flex items-center justify-center gap-2 print:hidden">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c8a86b]" />
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#c8a86b]">
                Gift Certificate Unwrapped
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#c8a86b]" />
            </div>

            {/* ── LUXURY HEAVYWEIGHT GIFT CERTIFICATE CARD ── */}
            <div
              ref={containerRef}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: "transform 0.15s ease-out",
              }}
              className="relative w-full max-w-lg rounded-3xl p-8 sm:p-11 bg-gradient-to-br from-[#122319] via-[#0b1610] to-[#060c09] border-2 border-[#c8a86b]/70 shadow-[0_30px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(200,168,107,0.2)] text-left overflow-hidden [transform-style:preserve-3d] print:border-2 print:border-black print:shadow-none print:bg-white print:text-black print:p-8"
            >
              {/* Specular Diagonal Sheen */}
              <div className="pointer-events-none absolute -inset-full bg-gradient-to-tr from-transparent via-[#c8a86b]/10 to-transparent rotate-45 transform translate-x-12 translate-y-12 print:hidden" />

              {/* Ornamental Gold Corner Accents */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#c8a86b] rounded-tl-sm print:hidden" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#c8a86b] rounded-tr-sm print:hidden" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#c8a86b] rounded-bl-sm print:hidden" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#c8a86b] rounded-br-sm print:hidden" />

              {/* Header: Studio Branding & Status */}
              <div className="flex items-start justify-between border-b border-[#c8a86b]/30 pb-5 mb-6 print:border-black/20">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl text-[#f3efe6] tracking-widest uppercase font-bold print:text-black">
                    Mari Esthetics
                  </h3>
                  <p className="text-[10px] tracking-[0.25em] text-[#c8a86b] uppercase font-semibold mt-0.5 print:text-black/70">
                    Private Esthetics Studio · Edmonton
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 print:border-black print:text-black print:bg-transparent">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 print:hidden" />
                    {giftCard.isExpired ? "EXPIRED" : "ACTIVE VOUCHER"}
                  </span>
                </div>
              </div>

              {/* Main Certificate Value Display */}
              <div className="my-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c8a86b] block mb-1 print:text-black/70">
                  Gift Certificate Amount
                </span>
                <div className="flex items-baseline gap-3">
                  <p className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#fff3d1] via-[#c8a86b] to-[#e8cf99] tracking-tight leading-none print:text-black print:bg-none">
                    ${giftCard.amountCad.toFixed(2)}
                  </p>
                  <span className="text-xl sm:text-2xl font-light text-[#f3efe6]/70 tracking-widest font-sans print:text-black">
                    CAD
                  </span>
                </div>
                {giftCard.remainingBalanceCents !== giftCard.initialBalanceCents && (
                  <p className="text-[11px] font-mono text-emerald-400 mt-2 print:text-black">
                    Remaining Balance: ${(giftCard.remainingBalanceCents / 100).toFixed(2)} CAD (Original: ${(giftCard.initialAmountCad).toFixed(2)})
                  </p>
                )}
              </div>

              {/* Personalized Dedicated Message / Birthday Wish */}
              {giftCard.message && (
                <div className="my-6 p-5 rounded-2xl bg-black/40 border border-[#c8a86b]/30 text-left print:bg-stone-50 print:border-black/15">
                  <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-[#c8a86b] block mb-1.5 print:text-black/70">
                    Personalized Note
                  </span>
                  <p className="text-xs sm:text-sm text-[#f3efe6] italic font-serif leading-relaxed print:text-black">
                    “{giftCard.message}”
                  </p>
                </div>
              )}

              {/* Recipient & Sender Row */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-[#c8a86b]/20 text-xs print:border-black/15">
                <div>
                  <span className="block text-[9px] uppercase font-bold tracking-[0.25em] text-[#f3efe6]/60 print:text-black/70">
                    Recipient
                  </span>
                  <p className="font-semibold text-[#f3efe6] text-sm sm:text-base mt-0.5 print:text-black truncate">
                    {giftCard.recipientName || "Valued Client"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] uppercase font-bold tracking-[0.25em] text-[#f3efe6]/60 print:text-black/70">
                    From
                  </span>
                  <p className="font-semibold text-[#f3efe6] text-sm sm:text-base mt-0.5 print:text-black truncate">
                    {giftCard.senderName || "Mari Esthetics"}
                  </p>
                </div>
              </div>

              {/* Voucher Code Box */}
              <div className="mt-5 pt-4 border-t border-[#c8a86b]/25 flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/30 p-3.5 sm:p-4 rounded-xl border border-[#c8a86b]/20 print:border-black/20 print:bg-stone-100">
                <div className="text-center sm:text-left min-w-0">
                  <span className="block text-[8px] uppercase font-bold tracking-[0.25em] text-[#c8a86b] print:text-black">
                    Redemption / Coupon Code
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-[#f3efe6] print:text-black select-all whitespace-nowrap block mt-0.5">
                    {giftCard.code}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="h-8 px-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-white/90 hover:text-white tracking-wider uppercase transition-all duration-150 active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer print:hidden"
                  title="Copy redemption code"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── ACTION BUTTONS (BELOW CARD) ── */}
            <div className="mt-6 w-full max-w-lg space-y-2.5 print:hidden">
              {/* Primary Redeem CTA: Clean, refined Privy-style gold action button */}
              <Link
                href={`/book?coupon=${giftCard.code}`}
                className="w-full h-11 px-5 rounded-full bg-[#c8a86b] hover:bg-[#d8b87b] text-[#0b140f] text-xs font-semibold uppercase tracking-wider transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow whitespace-nowrap"
              >
                <span>Book Appointment</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>

              {/* Secondary Actions: Print + Wrap Box Again */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 h-9 px-4 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium tracking-wide transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                >
                  <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  <span>Print Certificate</span>
                </button>

                <button
                  type="button"
                  onClick={handleWrapAgain}
                  className="flex-1 h-9 px-4 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium tracking-wide transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                >
                  <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span>Wrap Again</span>
                </button>
              </div>

              <p className="text-[11px] text-[#f3efe6]/50 font-light text-center pt-1.5">
                This certificate credit is automatically applied at online checkout or can be presented in-studio.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
