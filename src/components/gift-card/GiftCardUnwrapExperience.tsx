"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

  // 3D Tilt State for the Card
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const maxTilt = 12;
    setTilt({
      x: -(y / (rect.height / 2)) * maxTilt,
      y: (x / (rect.width / 2)) * maxTilt,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const handleUnwrap = () => {
    if (isOpening || isUnwrapped) return;
    setIsOpening(true);
    setTimeout(() => {
      setIsUnwrapped(true);
      setIsOpening(false);
    }, 700);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(giftCard.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 sm:py-24 overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="aurora pointer-events-none fixed inset-0 opacity-70 print:hidden" />

      {/* Confetti Celebration when Unwrapped */}
      {isUnwrapped && <ConfettiEffect mode="fixed" count={65} />}

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center">

        {/* ── STAGE 1: SEALED LUXURY GIFT BOX (BEFORE UNWRAP) ── */}
        {!isUnwrapped && (
          <div
            onClick={handleUnwrap}
            className={`cursor-pointer group flex flex-col items-center transition-all duration-700 ${
              isOpening ? "scale-105 opacity-80" : "hover:scale-[1.02]"
            }`}
          >
            {/* Header Callout */}
            <div className="mb-8 space-y-2 animate-in fade-in slide-in-from-top-4 duration-700">
              <span className="inline-block text-[11px] font-bold tracking-[0.3em] uppercase bg-[#c8a86b]/15 text-[#c8a86b] px-4 py-1.5 rounded-full border border-[#c8a86b]/30 shadow-sm">
                Special Delivery
              </span>
              <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-[var(--ink)] tracking-tight">
                You’ve Received a Gift!
              </h1>
              <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-sm mx-auto">
                From <span className="font-semibold text-[var(--ink)]">{giftCard.senderName}</span>
                {giftCard.recipientName ? ` for ${giftCard.recipientName}` : ""}
              </p>
            </div>

            {/* 3D Physical Gift Box Container */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 [perspective:1000px]">
              {/* Outer Glow */}
              <div className="absolute inset-0 rounded-3xl bg-radial from-[#c8a86b]/30 via-transparent to-transparent blur-2xl group-hover:from-[#c8a86b]/45 transition-all duration-500" />

              {/* Gift Box Lid */}
              <div
                className={`absolute -top-3 -left-3 -right-3 h-16 rounded-2xl bg-gradient-to-b from-[#182a20] via-[#101e16] to-[#0c1611] border-2 border-[#c8a86b]/60 shadow-2xl z-20 flex items-center justify-center transition-all duration-700 ${
                  isOpening ? "-translate-y-24 rotate-[-12deg] opacity-0" : "group-hover:-translate-y-1.5"
                }`}
              >
                {/* Lid Ribbon Cross */}
                <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-[#b89552] via-[#e8cf99] to-[#b89552] shadow-inner" />
                <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-[#b89552] via-[#e8cf99] to-[#b89552] shadow-inner" />

                {/* Golden Silk Bow */}
                <div className="relative z-30 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e8cf99] via-[#c8a86b] to-[#8d6f35] shadow-lg flex items-center justify-center border border-[#fff2d6]/40">
                    <span className="text-2xl drop-shadow-md">🎀</span>
                  </div>
                </div>
              </div>

              {/* Gift Box Base */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#122119] via-[#0d1812] to-[#08100c] border border-[#c8a86b]/40 shadow-2xl overflow-hidden flex items-center justify-center">
                {/* Box Vertical & Horizontal Silk Ribbons */}
                <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-[#b89552] via-[#e8cf99] to-[#b89552] shadow-md" />
                <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-[#b89552] via-[#e8cf99] to-[#b89552] shadow-md" />

                {/* Subtle Studio Monogram in Center */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-[#0a120e]/80 border border-[#c8a86b]/40 flex items-center justify-center backdrop-blur-xs">
                  <span className="font-[family-name:var(--font-display)] text-xl font-bold text-[#c8a86b] tracking-wider">
                    M
                  </span>
                </div>

                {/* Gift Tag Hanging */}
                <div className="absolute bottom-4 right-4 z-20 bg-[#f9f6ef] text-[#24180a] px-3 py-1.5 rounded-lg shadow-xl border border-[#c8a86b] text-[10px] font-bold tracking-wider uppercase rotate-[-6deg]">
                  To: {giftCard.recipientName.split(" ")[0] || "You"}
                </div>
              </div>
            </div>

            {/* Tap to Unwrap Prompt */}
            <div className="mt-8 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#c8a86b] animate-pulse">
              <span>✦</span>
              <span>Tap box to unwrap your gift certificate</span>
              <span>✦</span>
            </div>
          </div>
        )}

        {/* ── STAGE 2: UNWRAPPED 3D VIP CARD REVEAL ── */}
        {isUnwrapped && (
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 fade-in duration-700">
            {/* Top Celebration Badge */}
            <div className="mb-6 space-y-1.5 print:hidden">
              <span className="inline-block text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase bg-[#c8a86b]/20 text-[#e2c78c] px-3.5 py-1 rounded-full border border-[#c8a86b]/40 shadow-xs">
                Digital Gift Certificate
              </span>
              <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-[var(--ink)]">
                Unwrapped &amp; Ready to Redeem
              </h2>
            </div>

            {/* 3D TILT HOLOGRAPHIC VIP CARD */}
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: "transform 0.15s ease-out",
              }}
              className="relative w-full max-w-lg rounded-3xl p-6 sm:p-9 bg-gradient-to-br from-[#16231b] via-[#0d1611] to-[#070d0a] border-2 border-[#c8a86b]/70 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(200,168,107,0.25)] text-left overflow-hidden [transform-style:preserve-3d] print:border-none print:shadow-none print:bg-white print:text-black print:p-0"
            >
              {/* Metallic Specular Sweep Line */}
              <div className="pointer-events-none absolute -inset-full bg-gradient-to-tr from-transparent via-[#c8a86b]/15 to-transparent rotate-45 transform translate-x-12 translate-y-12 print:hidden" />

              {/* Decorative Corner Accents */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#c8a86b]/60 rounded-tl-sm print:hidden" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#c8a86b]/60 rounded-tr-sm print:hidden" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#c8a86b]/60 rounded-bl-sm print:hidden" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#c8a86b]/60 rounded-br-sm print:hidden" />

              {/* Header: Studio Branding & Status */}
              <div className="flex items-start justify-between border-b border-[#c8a86b]/30 pb-4 mb-6 print:border-black/20">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl text-[var(--ink)] tracking-widest uppercase print:text-black font-bold">
                    Mari Esthetics
                  </h3>
                  <p className="text-[10px] tracking-[0.25em] text-[#c8a86b] uppercase font-semibold mt-0.5 print:text-black">
                    Private Esthetics Studio · Edmonton
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 print:border-black print:text-black print:bg-transparent">
                    {giftCard.isExpired ? "EXPIRED" : "ACTIVE"}
                  </span>
                </div>
              </div>

              {/* Main Value Display */}
              <div className="my-6 text-center sm:text-left">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)] block mb-1 print:text-black/70">
                  Gift Certificate Value
                </span>
                <p className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#f5dfb8] via-[#c8a86b] to-[#dfbe7f] tracking-tight drop-shadow-sm print:text-black print:bg-none">
                  ${giftCard.amountCad.toFixed(2)}{" "}
                  <span className="text-xl sm:text-2xl font-mono text-[var(--ink-soft)] font-normal print:text-black">
                    CAD
                  </span>
                </p>
                {giftCard.remainingBalanceCents !== giftCard.initialBalanceCents && (
                  <p className="text-[11px] font-mono text-emerald-400 mt-1 print:text-black">
                    Remaining Balance: ${(giftCard.remainingBalanceCents / 100).toFixed(2)} CAD (Original: ${(giftCard.initialAmountCad).toFixed(2)})
                  </p>
                )}
              </div>

              {/* Personalized Gift Message */}
              {giftCard.message && (
                <div className="my-5 p-4 rounded-2xl bg-black/30 border border-[#c8a86b]/20 backdrop-blur-xs print:bg-stone-50 print:border-black/10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#c8a86b] block mb-1 print:text-black">
                    Personalized Note
                  </span>
                  <p className="text-xs sm:text-sm text-[var(--ink)] italic font-serif leading-relaxed print:text-black">
                    “{giftCard.message}”
                  </p>
                </div>
              )}

              {/* Recipient & Sender Row */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-[#c8a86b]/20 text-xs print:border-black/10">
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] print:text-black/70">
                    Recipient
                  </span>
                  <p className="font-semibold text-[var(--ink)] text-sm mt-0.5 print:text-black">
                    {giftCard.recipientName || "Valued Client"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] print:text-black/70">
                    From
                  </span>
                  <p className="font-semibold text-[var(--ink)] text-sm mt-0.5 print:text-black">
                    {giftCard.senderName || "Mari Esthetics"}
                  </p>
                </div>
              </div>

              {/* Voucher Code Box */}
              <div className="mt-4 pt-4 border-t border-[#c8a86b]/30 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#c8a86b]/10 p-3.5 rounded-2xl border border-[#c8a86b]/30 print:border-black/20 print:bg-stone-100">
                <div className="text-center sm:text-left">
                  <span className="block text-[9px] uppercase font-bold tracking-widest text-[#c8a86b] print:text-black">
                    Booking Voucher / Coupon Code
                  </span>
                  <span className="font-mono text-lg sm:text-xl font-extrabold tracking-widest text-[var(--ink)] print:text-black">
                    {giftCard.code}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3.5 py-1.5 rounded-xl border border-[#c8a86b]/50 bg-[var(--card-bg)] hover:bg-[#c8a86b]/20 text-xs font-bold text-[var(--ink)] cursor-pointer flex items-center gap-1.5 transition-all shadow-xs print:hidden"
                >
                  <span>{copied ? "✓" : "📋"}</span>
                  <span>{copied ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>
            </div>

            {/* ── ACTION BUTTONS (BELOW CARD) ── */}
            <div className="mt-8 w-full max-w-lg space-y-3 print:hidden">
              {/* Primary Redeem CTA */}
              <Link
                href={`/book?coupon=${giftCard.code}`}
                className="btn-primary w-full !py-3.5 rounded-2xl text-center block text-sm font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                📅 Book Appointment with this Gift Card →
              </Link>

              {/* Secondary Actions Row */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[#c8a86b]/10 text-xs font-semibold text-[var(--ink)] hover:text-[#c8a86b] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>🖨️</span>
                  <span>Print Voucher</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUnwrapped(false)}
                  className="py-2.5 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-stone-200 dark:hover:bg-white/10 text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer transition-all"
                  title="Wrap gift again"
                >
                  ↺ Wrap Again
                </button>
              </div>

              <p className="text-[11px] text-[var(--ink-soft)] text-center pt-2">
                ℹ️ This voucher code automatically applies your credit during online checkout or can be presented in-studio.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
