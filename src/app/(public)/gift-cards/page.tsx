"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { useLanguage } from "@/components/i18n/LanguageContext";

const DEFAULT_PRESETS = [
  { label: "$50 CAD", amount: 50 },
  { label: "$100 CAD", amount: 100 },
  { label: "$150 CAD", amount: 150 },
  { label: "$200 CAD", amount: 200 },
];

function GiftCardsContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const code = searchParams.get("code") || "";

  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [services, setServices] = useState<any[]>([]);

  const [recipientName, setRecipientName] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [senderName, setSenderName] = useState<string>("");
  const [senderEmail, setSenderEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"box" | "card">("box");

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.services) {
          setServices(data.services);
        }
      })
      .catch(() => {});
  }, []);

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
            {t("giftCardsPage.eyebrow") !== "giftCardsPage.eyebrow"
              ? t("giftCardsPage.eyebrow")
              : "Digital Certificates & Vouchers"}
          </p>
          <h1 className="display text-4xl sm:text-5xl md:text-7xl text-[var(--ink)] tracking-tight">
            {t("giftCardsPage.title") !== "giftCardsPage.title"
              ? t("giftCardsPage.title")
              : "Give the Gift of Self-Care."}
          </h1>
          <p className="max-w-2xl text-sm sm:text-base text-[var(--ink-soft)] leading-relaxed">
            {t("giftCardsPage.subtitle") !== "giftCardsPage.subtitle"
              ? t("giftCardsPage.subtitle")
              : "Purchase a digital gift certificate for loved ones. Delivered instantly via email with custom notes, redeemable online or in-studio."}
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
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <p className="text-xs font-mono font-bold text-[#c8a86b]">
                  Voucher Code: {code}
                </p>
                <Link
                  href={`/gift-cards/reveal/${code}`}
                  className="px-5 py-2 rounded-full bg-[#8052ff] hover:bg-[#6c3ef0] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(128,82,255,0.4)] flex items-center gap-2"
                >
                  <span>✦</span>
                  <span>View &amp; Awaken Certificate →</span>
                </Link>
              </div>
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

            {/* Treatment Service Shortcuts */}
            {services.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--ink-soft)] block">
                  ✨ Quick Treatment Value Shortcuts:
                </span>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => {
                    const priceCad = s.priceCents / 100;
                    return (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(priceCad);
                          setIsCustom(false);
                        }}
                        className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          !isCustom && selectedAmount === priceCad
                            ? "border-[#c8a86b] bg-[#c8a86b]/20 text-[#c8a86b] shadow-sm"
                            : "border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {s.name} (${priceCad} CAD)
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Standard Amount Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DEFAULT_PRESETS.map((preset) => (
                <button
                  key={preset.amount}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(preset.amount);
                    setIsCustom(false);
                  }}
                  className={`py-3 px-4 rounded-2xl border text-sm font-extrabold transition-all cursor-pointer ${
                    !isCustom && selectedAmount === preset.amount
                      ? "border-[#c8a86b] bg-[#c8a86b]/15 text-[#c8a86b] shadow-md scale-105"
                      : "border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--ink)] hover:border-[#c8a86b]/50"
                  }`}
                >
                  {preset.label}
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
                    step="any"
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
              <span>{loading ? "Preparing Card Checkout..." : `💳 Pay $${effectiveAmount.toFixed(2)} CAD via Card →`}</span>
            </button>
          </form>

          {/* Live Voucher Digital Card Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold tracking-[0.28em] text-[#ffb829] flex items-center gap-1.5">
                <span>✦</span>
                <span>Live Gift Preview</span>
              </span>
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode("box")}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    previewMode === "box"
                      ? "bg-[#8052ff] text-white shadow-xs"
                      : "text-[#9a9a9a] hover:text-white"
                  }`}
                >
                  Present Box
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("card")}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    previewMode === "card"
                      ? "bg-[#8052ff] text-white shadow-xs"
                      : "text-[#9a9a9a] hover:text-white"
                  }`}
                >
                  Certificate
                </button>
              </div>
            </div>

            {/* PREVIEW MODE 1: LUXURY PRESENT 3D CUBE */}
            {previewMode === "box" && (
              <div
                onClick={() => setPreviewMode("card")}
                className="cursor-pointer group border border-white/10 bg-[#060606] p-7 sm:p-9 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(128,82,255,0.12)] space-y-6 text-center relative overflow-hidden text-white backdrop-blur-xl transition-all duration-300 hover:scale-[1.01]"
              >
                {/* 3D Isometric Cube Container */}
                <div className="relative my-6 py-4 w-full flex items-center justify-center [perspective:1000px]">
                  {/* Floor Shadow */}
                  <div
                    style={{ transform: "rotateX(75deg) translateZ(-85px)" }}
                    className="absolute w-56 h-40 rounded-full bg-black/90 blur-xl pointer-events-none"
                  />

                  {/* Ambient Glow */}
                  <div className="absolute w-56 h-56 rounded-full bg-radial from-[#c8a86b]/20 via-[#8052ff]/10 to-transparent blur-2xl pointer-events-none group-hover:from-[#c8a86b]/35 transition-all duration-500" />

                  {/* 3D Rotated Cube */}
                  <div
                    style={{
                      transform: "rotateX(16deg) rotateY(-26deg)",
                      transformStyle: "preserve-3d",
                    }}
                    className="relative w-[160px] h-[140px] transition-transform duration-300 group-hover:rotate-y-[-20deg]"
                  >
                    {/* 3D LID */}
                    <div
                      style={{ transformStyle: "preserve-3d" }}
                      className="absolute -top-2.5 -left-2 w-[176px] h-[32px] z-30 transition-transform duration-300 group-hover:-translate-y-2"
                    >
                      {/* Lid Top Face */}
                      <div
                        style={{ transform: "rotateX(90deg) translateZ(16px)" }}
                        className="absolute inset-0 w-[176px] h-[176px] rounded-lg bg-gradient-to-br from-[#1d3326] via-[#13231b] to-[#0c1611] border-2 border-[#c8a86b]/70 shadow-lg flex items-center justify-center overflow-hidden"
                      >
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-gradient-to-r from-[#9b7835] via-[#fae7b9] to-[#9b7835]" />
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-6 bg-gradient-to-b from-[#9b7835] via-[#fae7b9] to-[#9b7835]" />
                        <div className="relative z-30 w-9 h-9 rounded-full bg-gradient-to-br from-[#fae7b9] via-[#c8a86b] to-[#7f6024] p-0.5 shadow-md flex items-center justify-center">
                          <div className="w-full h-full rounded-full bg-[#08100c] flex items-center justify-center">
                            <span className="text-[9px] font-bold text-[#fae7b9]">M</span>
                          </div>
                        </div>
                      </div>

                      {/* Lid Front Skirt */}
                      <div
                        style={{ transform: "translateZ(88px)" }}
                        className="absolute inset-0 w-[176px] h-[32px] bg-gradient-to-b from-[#1c2e24] to-[#0c1611] border-x border-b-2 border-[#c8a86b]/60 flex items-center justify-center overflow-hidden"
                      >
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-gradient-to-r from-[#9b7835] via-[#fae7b9] to-[#9b7835]" />
                      </div>

                      {/* Lid Right Skirt */}
                      <div
                        style={{ transform: "rotateY(90deg) translateZ(88px)" }}
                        className="absolute inset-0 w-[176px] h-[32px] bg-gradient-to-b from-[#14231b] to-[#08100c] border-x border-b-2 border-[#c8a86b]/40 flex items-center justify-center overflow-hidden"
                      >
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-gradient-to-r from-[#7f6024] via-[#d6bc85] to-[#7f6024]" />
                      </div>
                    </div>

                    {/* 3D CUBE BASE */}
                    <div style={{ transformStyle: "preserve-3d" }} className="absolute inset-0 w-[160px] h-[140px]">
                      {/* Front Face */}
                      <div
                        style={{ transform: "translateZ(80px)" }}
                        className="absolute inset-0 w-[160px] h-[140px] rounded-b-lg bg-gradient-to-b from-[#14231b] via-[#0d1712] to-[#060a08] border-x border-b-2 border-[#c8a86b]/50 shadow-xl overflow-hidden flex items-center justify-center"
                      >
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-gradient-to-r from-[#9b7835] via-[#fae7b9] to-[#9b7835]" />
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-6 bg-gradient-to-b from-[#9b7835] via-[#fae7b9] to-[#9b7835]" />

                        {/* Gift Tag */}
                        <div className="absolute bottom-2.5 right-2.5 z-20 bg-[#faf7f0] text-[#142018] px-2.5 py-1 rounded-lg shadow-xl border border-[#c8a86b] text-left rotate-[-4deg]">
                          <span className="block text-[6px] uppercase tracking-widest text-[#8b6e2d] font-bold">
                            Recipient
                          </span>
                          <span className="block font-semibold text-[9px] truncate max-w-[70px]">
                            {recipientName || "Recipient"}
                          </span>
                          <span className="block text-[7px] font-mono text-[#8b6e2d] font-bold">
                            ${effectiveAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Right Face (Depth) */}
                      <div
                        style={{ transform: "rotateY(90deg) translateZ(80px)" }}
                        className="absolute inset-0 w-[160px] h-[140px] rounded-b-lg bg-gradient-to-b from-[#0f1b14] via-[#09100c] to-[#040705] border-x border-b-2 border-[#c8a86b]/35 shadow-xl overflow-hidden"
                      >
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-6 bg-gradient-to-b from-[#7f6024] via-[#d6bc85] to-[#7f6024]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-white/90 font-medium">
                    Gift for <strong className="text-white">{recipientName || "Recipient"}</strong> from <strong className="text-white">{senderName || "You"}</strong>
                  </p>
                  <p className="text-[10px] text-[#ffb829] font-semibold uppercase tracking-wider">
                    ✦ Tap 3D cube to preview unboxing ✦
                  </p>
                </div>
              </div>
            )}

            {/* PREVIEW MODE 2: EMERGED CERTIFICATE */}
            {previewMode === "card" && (
              <div className="border border-white/10 bg-[#060606] p-7 sm:p-8 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(128,82,255,0.12)] space-y-6 text-left relative overflow-hidden text-white backdrop-blur-xl animate-in zoom-in-95 fade-in duration-300">
                {/* Internal Specular Diagonal Sheen */}
                <div className="pointer-events-none absolute -inset-full bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent rotate-45 transform translate-x-12 translate-y-12" />

                {/* Studio Header & Status */}
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <h4 className="text-base sm:text-lg font-normal tracking-[0.2em] text-white uppercase font-sans">
                      Mari Esthetics
                    </h4>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-[#9a9a9a] font-light mt-0.5">
                      Edmonton, Alberta
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-[#15846e]/20 text-emerald-400 border border-[#15846e]/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>

                {/* Live Scaled Value Display */}
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-[0.25em] text-[#ffb829] block mb-1">
                    Gift Certificate Value
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-normal text-white tracking-[-0.04em] leading-none">
                      ${effectiveAmount.toFixed(2)}
                    </span>
                    <span className="text-sm font-light text-[#9a9a9a] tracking-widest font-sans">
                      CAD
                    </span>
                  </div>
                </div>

                {/* Live Recipient & Sender */}
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="block text-[9px] uppercase font-semibold tracking-[0.25em] text-[#9a9a9a]">
                      Recipient
                    </span>
                    <p className="font-normal text-white text-sm mt-0.5 truncate">
                      {recipientName || "Recipient Name"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] uppercase font-semibold tracking-[0.25em] text-[#9a9a9a]">
                      From
                    </span>
                    <p className="font-normal text-white text-sm mt-0.5 truncate">
                      {senderName || "Sender Name"}
                    </p>
                  </div>
                </div>

                {/* Live Message Dedication */}
                {message && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-[9px] uppercase font-semibold tracking-[0.25em] text-[#9a9a9a] block mb-1">
                      Dedication Note
                    </span>
                    <p className="text-xs text-white/90 font-extralight italic leading-relaxed line-clamp-3">
                      “{message}”
                    </p>
                  </div>
                )}

                {/* Voucher Code Preview Bar */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-[#9a9a9a]">
                  <span className="font-mono tracking-widest text-white/80">MARI-GIFT-••••••</span>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("box")}
                    className="text-[9px] uppercase tracking-wider text-[#ffb829] hover:underline cursor-pointer font-semibold"
                  >
                    ← Close &amp; View Box
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GiftCardsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-24 text-center">Loading...</div>}>
      <GiftCardsContent />
    </Suspense>
  );
}
