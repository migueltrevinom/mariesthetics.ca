"use client";

import { useState, useEffect } from "react";
import { formatCad } from "@/lib/money";

export interface TipButtonProps {
  bookingId: string;
  serviceName?: string;
  serviceCategory?: string;
  durationMin?: number;
  totalCents?: number;
  paidCents?: number;
  balanceDueCents?: number;
  hasPendingBalance?: boolean;
  clientName?: string;
  className?: string;
  buttonLabel?: string;
}

const COMPLIMENT_OPTIONS = [
  "💖 Best lashes in Edmonton!",
  "🌿 So gentle & relaxing",
  "✨ Obsessed with the retention",
  "🪄 True lash artistry!",
  "💫 Amazing studio vibe",
];

export function TipButton({
  bookingId,
  serviceName = "Esthetics Treatment",
  serviceCategory,
  durationMin,
  totalCents = 0,
  paidCents = 0,
  balanceDueCents = 0,
  hasPendingBalance = false,
  clientName,
  className = "",
  buttonLabel,
}: TipButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isBalancePayment = balanceDueCents > 0;

  // Default to 18% tip (clients can easily pick 0% / No Tip if desired)
  const [selectedPreset, setSelectedPreset] = useState<number | "custom">(18);
  const [customAmount, setCustomAmount] = useState<string>("15");
  const [selectedCompliment, setSelectedCompliment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Base price calculation for percentage suggestions
  const basePriceCents = totalCents > 0 ? totalCents : balanceDueCents > 0 ? balanceDueCents : 9000;

  // Compute preset tip amounts in cents
  const presets = [
    ...(isBalancePayment
      ? [
          {
            pct: 0,
            label: "No Tip",
            amountCents: 0,
          },
        ]
      : []),
    {
      pct: 15,
      label: "Wonderful",
      amountCents: Math.round((basePriceCents * 0.15) / 100) * 100 || 1200,
    },
    {
      pct: 18,
      label: "Loved It",
      amountCents: Math.round((basePriceCents * 0.18) / 100) * 100 || 1600,
      popular: true,
    },
    {
      pct: 20,
      label: "Exceptional",
      amountCents: Math.round((basePriceCents * 0.20) / 100) * 100 || 1800,
    },
    {
      pct: 25,
      label: "Above & Beyond",
      amountCents: Math.round((basePriceCents * 0.25) / 100) * 100 || 2200,
    },
  ];

  // Current tip amount in cents
  const currentTipCents =
    selectedPreset === 0
      ? 0
      : selectedPreset === "custom"
      ? Math.max(0, Math.round((parseFloat(customAmount) || 0) * 100))
      : presets.find((p) => p.pct === selectedPreset)?.amountCents || 0;

  const totalToPayCents = isBalancePayment ? balanceDueCents + currentTipCents : currentTipCents;

  // Lock background scroll and close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Contextual service description
  const categoryLower = (serviceCategory || serviceName).toLowerCase();
  const isLashService = categoryLower.includes("lash");
  const isBrowService = categoryLower.includes("brow");
  const isFacialService = categoryLower.includes("facial") || categoryLower.includes("skin");

  let serviceCraftDescription =
    "Every treatment at Mari Esthetics is handcrafted with personalized care, gentle precision, and hospital-grade sanitation to elevate your natural beauty.";

  if (isLashService) {
    serviceCraftDescription =
      "Each lash set is meticulously customized—isolating every natural lash and tailoring curl, diameter, and mapping to enhance your eye shape while preserving the health of your natural lashes.";
  } else if (isBrowService) {
    serviceCraftDescription =
      "Custom-mapped to balance facial symmetry and frame your features, enhancing natural hair texture, fullness, and definition.";
  } else if (isFacialService) {
    serviceCraftDescription =
      "A tailored professional treatment designed to deeply cleanse, hydrate, and restore your skin’s luminous vitality.";
  }

  async function handleCheckout() {
    if (loading || totalToPayCents <= 0) return;
    setLoading(true);
    setError("");

    try {
      if (isBalancePayment) {
        const res = await fetch("/api/payments/balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            amountCents: balanceDueCents,
            tipCents: currentTipCents > 0 ? currentTipCents : 0,
            compliment: selectedCompliment || undefined,
            forceNew: true,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to initiate balance checkout");
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        if (currentTipCents <= 0) return;
        const res = await fetch("/api/payments/tip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            amountCents: currentTipCents,
            compliment: selectedCompliment || undefined,
            returnUrl: "/portal",
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to initiate tip checkout");
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment");
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger Button */}
      {isBalancePayment ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#c8a86b] via-[#d4af37] to-[#b89552] hover:brightness-105 active:scale-[0.99] text-[#0b100d] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#c8a86b]/20 transition-all cursor-pointer ${className}`}
        >
          <svg className="w-4 h-4 text-[#0b100d] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>
            {buttonLabel
              ? buttonLabel
              : hasPendingBalance
              ? `Resume & Pay Balance (${formatCad(balanceDueCents)})`
              : `Pay Remaining Balance (${formatCad(balanceDueCents)})`}
          </span>
          <span aria-hidden="true">→</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`px-4 py-2 rounded-xl border border-[var(--gold)] bg-[var(--gold)]/15 hover:bg-[var(--gold)]/25 dark:bg-[var(--gold)]/20 dark:hover:bg-[var(--gold)]/30 text-xs font-semibold text-[#6e5015] dark:text-[#f3efe6] flex items-center gap-2 shadow-xs hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${className}`}
        >
          <span className="text-amber-500 dark:text-amber-400">✨</span>
          <span>{buttonLabel || "Leave a Tip"}</span>
        </button>
      )}

      {/* Luxury Checkout & Appreciation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl border border-[#c8a86b]/40 bg-[#fdfaf5] dark:bg-[#0b120e] p-6 sm:p-8 shadow-2xl text-[#12241c] dark:text-[#f3efe6] my-auto max-h-[92vh] overflow-y-auto space-y-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 h-8 w-8 rounded-full border border-stone-300 dark:border-white/10 bg-stone-200/50 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300 hover:text-black dark:hover:text-white flex items-center justify-center transition-all cursor-pointer text-sm"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Header / Brand */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#c8a86b]/15 border border-[#c8a86b]/35 text-[10px] uppercase tracking-widest text-[#8a6e35] dark:text-[#dfc28d] font-bold mb-2">
                <span>✨</span> Mari Esthetics · {isBalancePayment ? "Studio Checkout & Gratitude" : "Studio Gratitude"}
              </div>
              <h2
                id="payment-modal-title"
                className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-stone-900 dark:text-white leading-snug font-bold"
              >
                {isBalancePayment ? "Complete Your Studio Payment" : "Thank You for Trusting Us With Your Beauty"}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
                {clientName ? `Dear ${clientName}, ` : ""}Mari puts genuine heart, meticulous precision, and personal dedication into every service.
              </p>
            </div>

            {/* Service Spotlight Card */}
            <div className="rounded-2xl border border-stone-200 dark:border-white/10 bg-stone-100/80 dark:bg-white/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#8a6e35] dark:text-[#dfc28d]">
                  {serviceName}
                </span>
                {durationMin && (
                  <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                    {durationMin} mins
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {serviceCraftDescription}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 italic pt-1 border-t border-stone-200 dark:border-white/5">
                “Your trust and support of our Edmonton studio mean the absolute world to us!” — Mari
              </p>
            </div>

            {/* Remaining Balance Due Section (if balance payment) */}
            {isBalancePayment && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 p-4 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300 block">
                    Treatment Remaining Balance
                  </span>
                  <span className="text-xs text-amber-900/80 dark:text-stone-300">
                    Due for completion of {serviceName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200">
                    {formatCad(balanceDueCents)}
                  </span>
                </div>
              </div>
            )}

            {/* Gratuity / Tip Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  {isBalancePayment ? "Would you like to add a tip for Mari?" : "Leave a tip for Mari"}
                </label>
                <span className="text-[11px] text-[#8a6e35] dark:text-[#c8a86b] font-mono font-medium">
                  100% goes directly to your artist
                </span>
              </div>

              <div className={`grid ${isBalancePayment ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"} gap-2`}>
                {presets.map((preset) => {
                  const isSelected = selectedPreset === preset.pct;
                  return (
                    <button
                      key={preset.pct}
                      type="button"
                      onClick={() => setSelectedPreset(preset.pct)}
                      className={`relative p-2.5 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? "border-[#c8a86b] bg-[#c8a86b]/20 dark:bg-[#c8a86b]/25 shadow-md ring-2 ring-[#c8a86b]/60"
                          : "border-stone-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-stone-300 dark:hover:border-white/25 hover:bg-stone-50 dark:hover:bg-white/10"
                      }`}
                    >
                      {preset.popular && (
                        <span className="absolute -top-2 px-1.5 py-0.2 rounded-full bg-[#c8a86b] text-[#0b100d] text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shadow-xs">
                          ★ Loved
                        </span>
                      )}
                      <span className="font-mono text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                        {preset.pct === 0 ? "No Tip" : `${preset.pct}%`}
                      </span>
                      <span className="font-mono text-[11px] sm:text-xs text-[#8a6e35] dark:text-[#dfc28d] font-bold">
                        {formatCad(preset.amountCents)}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 truncate max-w-full font-medium">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Tip Amount Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedPreset("custom")}
                  className={`text-xs underline transition-colors cursor-pointer ${
                    selectedPreset === "custom"
                      ? "text-[#8a6e35] dark:text-[#dfc28d] font-bold"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  {selectedPreset === "custom" ? "Custom gratuity entered:" : "Enter custom amount instead →"}
                </button>

                {selectedPreset === "custom" && (
                  <div className="mt-2 flex items-center gap-2 p-2.5 rounded-2xl border border-[#c8a86b]/50 bg-white dark:bg-white/5 shadow-xs">
                    <span className="font-mono text-sm text-[#8a6e35] dark:text-[#dfc28d] font-bold pl-2">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full bg-transparent text-sm text-stone-900 dark:text-white focus:outline-none font-mono"
                      autoFocus
                    />
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono pr-2">CAD</span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Compliment / Note for Mari */}
            <div className="space-y-2">
              <label className="text-[11px] text-stone-500 dark:text-stone-400 font-medium block">
                Include a sweet note for Mari (optional):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMPLIMENT_OPTIONS.map((c) => {
                  const isChosen = selectedCompliment === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCompliment(isChosen ? "" : c)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] border transition-all cursor-pointer ${
                        isChosen
                          ? "border-[#c8a86b] bg-[#c8a86b]/20 dark:bg-[#c8a86b]/25 text-[#735824] dark:text-[#dfc28d] font-bold"
                          : "border-stone-200 dark:border-white/10 bg-white dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/10 hover:text-stone-900 dark:hover:text-white"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Total Summary & Checkout Action */}
            <div className="pt-3 border-t border-stone-200 dark:border-white/10 space-y-3">
              {isBalancePayment ? (
                <div className="space-y-2 bg-stone-100/90 dark:bg-white/5 p-4 rounded-2xl border border-stone-200 dark:border-white/10 text-xs shadow-xs">
                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                    <span>Remaining Balance:</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">{formatCad(balanceDueCents)}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                    <span>Artist Gratuity:</span>
                    <span className="font-mono font-bold text-[#8a6e35] dark:text-[#dfc28d]">
                      {currentTipCents > 0 ? formatCad(currentTipCents) : "$0.00"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-white/10 text-sm font-bold text-stone-900 dark:text-white">
                    <span>Total Due at Checkout:</span>
                    <span className="font-mono text-lg font-black text-[#8a6e35] dark:text-[#dfc28d]">
                      {formatCad(totalToPayCents)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm p-3 rounded-2xl bg-stone-100/90 dark:bg-white/5 border border-stone-200 dark:border-white/10">
                  <span className="text-stone-600 dark:text-stone-300 font-medium">Gratuity for Mari:</span>
                  <span className="font-mono text-lg font-bold text-[#8a6e35] dark:text-[#dfc28d]">
                    {formatCad(currentTipCents)}
                  </span>
                </div>
              )}

              <button
                type="button"
                disabled={loading || totalToPayCents <= 0}
                onClick={() => void handleCheckout()}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#c8a86b] to-[#b38e46] text-[#0b120e] font-bold text-sm hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-[#c8a86b]/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-[#0b120e]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Connecting to Secure Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isBalancePayment
                        ? `Proceed to Secure Checkout (${formatCad(totalToPayCents)})`
                        : `Send ${formatCad(currentTipCents)} Gratuity with Card`}
                    </span>
                    <span>→</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1">
                <span>🔒 Secure checkout via Stripe</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="hover:text-stone-900 dark:hover:text-white underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
