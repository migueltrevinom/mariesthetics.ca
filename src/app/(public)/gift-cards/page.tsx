"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

const PRESET_AMOUNTS = [50, 100, 150, 200];

export default function GiftCardsPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const code = searchParams.get("code") || "";

  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const [recipientName, setRecipientName] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [senderName, setSenderName] = useState<string>("");
  const [senderEmail, setSenderEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const effectiveAmount = isCustom
    ? parseFloat(customAmount) || 0
    : selectedAmount;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (effectiveAmount <= 0) {
      setError("Please select or enter a valid gift card amount");
      return;
    }
    if (!recipientEmail) {
      setError("Recipient email is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/public/gift-cards/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCad: effectiveAmount,
          recipientName,
          recipientEmail,
          senderName,
          senderEmail,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize gift card checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="aurora grain relative min-h-screen overflow-hidden pt-36 pb-24 md:pt-44 text-left">
      <div className="relative mx-auto max-w-5xl px-6 md:px-10 space-y-12">
        {/* Header */}
        <div className="text-center sm:text-left space-y-3">
          <p className="eyebrow font-bold tracking-[0.28em] text-[#856526] dark:text-[#c8a86b]">
            Digital Certificates & Vouchers
          </p>
          <h1 className="display text-4xl sm:text-5xl md:text-7xl text-[var(--ink)] tracking-tight">
            Give the Gift of Self-Care.
          </h1>
          <p className="max-w-2xl text-sm sm:text-base text-[var(--ink-soft)] leading-relaxed">
            Purchase a digital gift certificate for loved ones. Delivered instantly via email with custom notes, redeemable online or in-studio.
          </p>
        </div>

        {/* Success Alert Banner */}
        {success && (
          <div className="p-6 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 space-y-2 animate-in fade-in zoom-in duration-300">
            <span className="text-xl font-bold block">🎉 Gift Certificate Issued Successfully!</span>
            <p className="text-xs font-medium text-[var(--ink)]">
              Thank you for your purchase! A digital voucher with redemption instructions has been dispatched to the recipient's email.
            </p>
            {code && (
              <p className="text-xs font-mono font-bold text-[#c8a86b] pt-1">
                Voucher Code: {code}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Purchase Form */}
          <form onSubmit={handleCheckout} className="lg:col-span-7 border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
            <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-[var(--ink)] border-b border-[var(--border-color)] pb-3">
              1. Select Gift Amount
            </h2>

            {error && (
              <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-500 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Amount Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt);
                    setIsCustom(false);
                  }}
                  className={`py-3 px-4 rounded-2xl border text-sm font-extrabold transition-all cursor-pointer ${
                    !isCustom && selectedAmount === amt
                      ? "border-[#c8a86b] bg-[#c8a86b]/15 text-[#c8a86b] shadow-md scale-105"
                      : "border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--ink)] hover:border-[#c8a86b]/50"
                  }`}
                >
                  ${amt} CAD
                </button>
              ))}
            </div>

            {/* Custom Amount Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-xs font-bold text-[#c8a86b] hover:underline cursor-pointer"
              >
                {isCustom ? "← Choose Preset Amount" : "+ Enter Custom Amount"}
              </button>

              {isCustom && (
                <div className="mt-3">
                  <label className="text-[10px] uppercase font-extrabold text-[var(--ink-soft)] block mb-1">
                    Custom Amount (CAD $)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="5"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full border border-[var(--border-color)] bg-[var(--background)] px-4 py-2.5 rounded-xl text-sm font-mono text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  />
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-[var(--ink)] border-b border-[var(--border-color)] pt-2 pb-3">
              2. Recipient & Personal Note
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--ink-soft)] block mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Johns"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--ink-soft)] block mb-1">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="sarah@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--ink-soft)] block mb-1">
                  Your Name (Sender)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Miguel Treviño"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--ink-soft)] block mb-1">
                  Your Email
                </label>
                <input
                  type="email"
                  placeholder="miguel@example.com"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--ink-soft)] block mb-1">
                Personalized Message / Wish
              </label>
              <textarea
                rows={3}
                placeholder="Happy Birthday! Enjoy your pampering treatment session at Mari Esthetics..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-xs font-bold shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? "Preparing Stripe Checkout..." : `💳 Checkout $${effectiveAmount.toFixed(2)} CAD via Stripe →`}</span>
            </button>
          </form>

          {/* Live Voucher Digital Card Preview */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#c8a86b]">
              ✨ Live Voucher Preview
            </h3>

            <div className="border-2 border-dashed border-[#c8a86b]/50 bg-gradient-to-br from-[var(--card-bg)] to-black/30 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 font-[family-name:var(--font-display)] text-6xl text-[#c8a86b] font-bold">
                MARI
              </div>

              <div>
                <span className="text-2xl block mb-1">🎁</span>
                <h4 className="text-lg font-extrabold text-[#c8a86b] font-[family-name:var(--font-display)]">
                  Mari Esthetics Studio
                </h4>
                <p className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)] font-mono">
                  Edmonton, Alberta
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-[var(--ink-soft)]">
                  For: <strong className="text-[var(--ink)]">{recipientName || "Recipient Name"}</strong>
                </p>
                <p className="text-xs text-[var(--ink-soft)]">
                  From: <strong className="text-[var(--ink)]">{senderName || "Sender Name"}</strong>
                </p>
              </div>

              {message && (
                <p className="text-xs italic text-[var(--ink-soft)] bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-[var(--border-color)]">
                  "{message}"
                </p>
              )}

              <div className="bg-[#c8a86b]/15 border border-[#c8a86b]/40 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#c8a86b] font-bold block">
                  Gift Certificate Value
                </span>
                <span className="text-3xl font-extrabold text-[var(--ink)] font-mono">
                  ${effectiveAmount.toFixed(2)} <span className="text-xs text-[var(--ink-soft)]">CAD</span>
                </span>
              </div>

              <p className="text-[10px] text-[var(--ink-soft)] font-mono">
                Code will be generated &amp; synced with Stripe upon checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
