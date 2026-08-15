"use client";

import { useState } from "react";
import { formatCad } from "@/lib/money";

export interface ServiceOptionItem {
  _id: string;
  name: string;
  priceCents: number;
}

export interface PlanItem {
  _id: string;
  name: string;
  description: string;
  interval: string;
  priceCents: number;
  billingNote?: string;
  visitsPerPeriod?: number;
  includedServiceIds?: (ServiceOptionItem | string)[];
}

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PlanItem | null;
  allPlans: PlanItem[];
}

export function SubscribeModal({
  isOpen,
  onClose,
  selectedPlan,
  allPlans,
}: SubscribeModalProps) {
  const [activePlan, setActivePlan] = useState<PlanItem | null>(selectedPlan || allPlans[0] || null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "etransfer">("stripe");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPlan = activePlan || selectedPlan || allPlans[0];

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPlan) {
      setError("Please select a membership plan.");
      return;
    }
    if (!name.trim() || !email.trim() || !email.includes("@")) {
      setError("Please enter your name and valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/payments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: currentPlan._id,
          paymentMethod,
          guest: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            countryCode: "+1",
            phone: phone.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start membership subscription.");

      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        setSuccessMsg(data.message || "Membership registered successfully!");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0f1712] border border-[#c8a86b]/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--ink-soft)] hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#c8a86b]">
            Mari Esthetics VIP Membership
          </span>
          <h2 className="display text-2xl sm:text-3xl text-[var(--ink)] mt-1">
            Start Your Skincare Membership
          </h2>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Enjoy recurring treatment perks, priority booking, and exclusive savings.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {successMsg ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center space-y-4">
            <span className="text-4xl block">🎉</span>
            <p className="text-sm font-semibold">{successMsg}</p>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary text-xs !py-2.5 !px-6"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-5 text-xs">
            {/* Plan Selector */}
            {allPlans.length > 1 && (
              <div>
                <label className="block text-[var(--ink-soft)] font-bold mb-2">Choose Plan:</label>
                <div className="grid grid-cols-2 gap-3">
                  {allPlans.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => setActivePlan(p)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        currentPlan?._id === p._id
                          ? "border-[#c8a86b] bg-[#c8a86b]/10 text-white font-bold"
                          : "border-[var(--border-color)] bg-[var(--background)] text-[var(--ink-soft)]"
                      }`}
                    >
                      <p className="font-semibold text-sm truncate">{p.name}</p>
                      <p className="gold-text font-bold text-xs mt-0.5">
                        {formatCad(p.priceCents)} / {p.interval}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Plan Details Card */}
            {currentPlan && (
              <div className="p-4 rounded-2xl bg-black/40 border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--ink)]">{currentPlan.name}</span>
                  <span className="gold-text text-lg font-bold">
                    {formatCad(currentPlan.priceCents)}{" "}
                    <span className="text-xs font-normal text-[var(--ink-soft)]">
                      /{currentPlan.interval}
                    </span>
                  </span>
                </div>
                {currentPlan.description && (
                  <p className="text-xs text-[var(--ink-soft)]">{currentPlan.description}</p>
                )}
                {currentPlan.includedServiceIds && currentPlan.includedServiceIds.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-color)] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase font-bold text-[var(--ink-soft)] tracking-wider">
                        Covered Treatments ({currentPlan.includedServiceIds.length}):
                      </p>
                      {currentPlan.visitsPerPeriod && (
                        <span className="text-[10px] text-[#c8a86b] font-semibold bg-[#c8a86b]/10 px-2 py-0.5 rounded">
                          {currentPlan.visitsPerPeriod} visit{currentPlan.visitsPerPeriod > 1 ? "s" : ""} / {currentPlan.interval}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPlan.includedServiceIds.map((s: any) => {
                        const name = typeof s === "object" && s !== null && s.name ? s.name : "Service";
                        const price = typeof s === "object" && s !== null && s.priceCents ? formatCad(s.priceCents) : null;
                        return (
                          <span
                            key={typeof s === "object" ? s._id : String(s)}
                            className="bg-[#c8a86b]/15 border border-[#c8a86b]/30 text-[#c8a86b] text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                          >
                            <span>✨</span>
                            <span>{name}</span>
                            {price && <span className="text-[10px] opacity-80 font-normal">({price} val)</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {currentPlan.billingNote && (
                  <p className="text-[11px] text-[#c8a86b] font-medium pt-1">💡 {currentPlan.billingNote}</p>
                )}
              </div>
            )}

            {/* Guest Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-[var(--ink-soft)] font-bold mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Marinelle Tala"
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--ink)] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--ink-soft)] font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mari@example.com"
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--ink)] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[var(--ink-soft)] font-bold mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 780-913-3081"
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--ink)] font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[var(--ink-soft)] font-bold mb-2">Payment Method:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("stripe")}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paymentMethod === "stripe"
                      ? "border-[#c8a86b] bg-[#c8a86b]/10 text-white font-bold"
                      : "border-[var(--border-color)] bg-[var(--background)] text-[var(--ink-soft)]"
                  }`}
                >
                  💳 Debit or Credit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("etransfer")}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paymentMethod === "etransfer"
                      ? "border-[#c8a86b] bg-[#c8a86b]/10 text-white font-bold"
                      : "border-[var(--border-color)] bg-[var(--background)] text-[var(--ink-soft)]"
                  }`}
                >
                  📲 Interac e-Transfer
                </button>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-[var(--ink-soft)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-xs !py-3 !px-6 shadow-md"
              >
                {loading ? "Processing..." : `Subscribe Now (${formatCad(currentPlan?.priceCents || 0)}) →`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
