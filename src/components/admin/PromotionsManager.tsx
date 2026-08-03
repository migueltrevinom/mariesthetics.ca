"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface CouponItem {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  maxRedemptions?: number | null;
  redemptionCount?: number;
  expiresAt?: string | null;
  stripeCouponId?: string;
  active: boolean;
}

export interface GiftCardItem {
  _id: string;
  code: string;
  initialBalanceCents: number;
  remainingBalanceCents: number;
  senderName?: string;
  recipientName?: string;
  recipientEmail: string;
  stripeCouponId?: string;
  active: boolean;
  createdAt?: string;
}

interface PromotionsManagerProps {
  initialCoupons: CouponItem[];
  initialGiftCards: GiftCardItem[];
}

export function PromotionsManager({ initialCoupons, initialGiftCards }: PromotionsManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"coupons" | "giftCards">("coupons");
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [giftCards, setGiftCards] = useState<GiftCardItem[]>(initialGiftCards);

  // Coupon modal state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"percent" | "fixed">("percent");
  const [couponValue, setCouponValue] = useState<number>(20);
  const [couponMaxRedemptions, setCouponMaxRedemptions] = useState<string>("");
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Gift Card modal state
  const [isGiftCardModalOpen, setIsGiftCardModalOpen] = useState(false);
  const [giftAmount, setGiftAmount] = useState<number>(100);
  const [giftRecipientName, setGiftRecipientName] = useState("");
  const [giftRecipientEmail, setGiftRecipientEmail] = useState("");
  const [giftSenderName, setGiftSenderName] = useState("Mari Esthetics Studio");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftSaving, setGiftSaving] = useState(false);
  const [giftError, setGiftError] = useState("");

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponSaving(true);
    setCouponError("");
    try {
      const payload = {
        code: couponCode,
        type: couponType,
        value: Number(couponValue),
        maxRedemptions: couponMaxRedemptions ? parseInt(couponMaxRedemptions, 10) : null,
      };

      const res = await fetch("/api/admin/promotions/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create coupon");

      setCoupons((prev) => [data.coupon, ...prev]);
      setIsCouponModalOpen(false);
      setCouponCode("");
      router.refresh();
    } catch (err: any) {
      setCouponError(err.message || "An error occurred");
    } finally {
      setCouponSaving(false);
    }
  }

  async function handleDeleteCoupon(id: string) {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`/api/admin/promotions/coupons/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete coupon");

      setCoupons((prev) => prev.filter((c) => c._id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete coupon");
    }
  }

  async function handleIssueGiftCard(e: React.FormEvent) {
    e.preventDefault();
    setGiftSaving(true);
    setGiftError("");
    try {
      const payload = {
        amountCad: Number(giftAmount),
        recipientName: giftRecipientName,
        recipientEmail: giftRecipientEmail,
        senderName: giftSenderName,
        message: giftMessage,
      };

      const res = await fetch("/api/admin/promotions/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to issue gift card");

      setGiftCards((prev) => [data.giftCard, ...prev]);
      setIsGiftCardModalOpen(false);
      setGiftRecipientName("");
      setGiftRecipientEmail("");
      setGiftMessage("");
      router.refresh();
    } catch (err: any) {
      setGiftError(err.message || "An error occurred");
    } finally {
      setGiftSaving(false);
    }
  }

  async function handleDeleteGiftCard(id: string) {
    if (!confirm("Are you sure you want to delete this gift card?")) return;
    try {
      const res = await fetch(`/api/admin/promotions/gift-cards/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete gift card");

      setGiftCards((prev) => prev.filter((g) => g._id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete gift card");
    }
  }

  return (
    <div className="w-full text-left space-y-8">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Coupons &amp; Gift Certificates
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Manage Stripe-synced discount promo codes and issue digital gift cards.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {activeTab === "coupons" ? (
            <button
              type="button"
              onClick={() => {
                setCouponCode(`PROMO${Math.floor(10 + Math.random() * 90)}`);
                setIsCouponModalOpen(true);
              }}
              className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md cursor-pointer"
            >
              + Create Discount Coupon
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsGiftCardModalOpen(true)}
              className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md cursor-pointer"
            >
              🎁 Issue Manual Gift Card
            </button>
          )}
        </div>
      </div>

      {/* Tabs selector */}
      <div className="flex border-b border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => setActiveTab("coupons")}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "coupons"
              ? "border-[#c8a86b] text-[#c8a86b]"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          Discount Coupons ({coupons.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("giftCards")}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "giftCards"
              ? "border-[#c8a86b] text-[#c8a86b]"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          Digital Gift Cards ({giftCards.length})
        </button>
      </div>

      {/* TAB 1: DISCOUNT COUPONS */}
      {activeTab === "coupons" && (
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--ink)]">
            <thead className="text-[var(--ink-soft)]/75 border-b border-[var(--border-color)]">
              <tr>
                <th className="py-2.5 pr-4 font-bold text-xs uppercase">Coupon Code</th>
                <th className="py-2.5 pr-4 font-bold text-xs uppercase">Discount Value</th>
                <th className="py-2.5 pr-4 font-bold text-xs uppercase">Redemptions</th>
                <th className="py-2.5 pr-4 font-bold text-xs uppercase">Stripe Sync</th>
                <th className="py-2.5 text-right font-bold text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id} className="border-b border-[var(--border-color)]/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-xs text-[#c8a86b]">
                    {c.code}
                  </td>
                  <td className="py-3 pr-4 text-xs font-bold">
                    {c.type === "percent" ? `${c.value}% OFF` : `$${c.value.toFixed(2)} CAD OFF`}
                  </td>
                  <td className="py-3 pr-4 text-xs font-medium text-[var(--ink-soft)]">
                    {c.redemptionCount || 0} / {c.maxRedemptions ? c.maxRedemptions : "∞"}
                  </td>
                  <td className="py-3 pr-4 text-xs font-bold">
                    {c.stripeCouponId ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
                        ⚡ Synced to Stripe
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border border-gray-500/40 bg-gray-500/10 text-gray-400">
                        Local DB Only
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right text-xs">
                    <button
                      type="button"
                      onClick={() => void handleDeleteCoupon(c._id)}
                      className="px-2.5 py-1 rounded-lg border border-rose-500/30 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && (
            <p className="py-8 text-center text-xs text-[var(--ink-soft)] italic">
              No discount coupons created yet.
            </p>
          )}
        </div>
      )}

      {/* TAB 2: DIGITAL GIFT CARDS */}
      {activeTab === "giftCards" && (
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--ink)]">
            <thead className="text-[var(--ink-soft)]/75 border-b border-[var(--border-color)]">
              <tr>
                <th className="py-2.5 pr-4 font-bold text-xs uppercase">Voucher Code</th>
                <th className="py-2.5 pr-4 font-bold text-xs uppercase">Balance</th>
                <th className="py-2.5 pr-4 font-bold text-xs uppercase">Recipient</th>
                <th className="py-2.5 pr-4 font-bold text-xs uppercase">Sender</th>
                <th className="py-2.5 pr-4 font-bold text-xs uppercase">Stripe Sync</th>
                <th className="py-2.5 text-right font-bold text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {giftCards.map((g) => (
                <tr key={g._id} className="border-b border-[var(--border-color)]/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-xs text-[#c8a86b]">
                    {g.code}
                  </td>
                  <td className="py-3 pr-4 text-xs font-bold font-mono">
                    ${(g.remainingBalanceCents / 100).toFixed(2)} CAD
                  </td>
                  <td className="py-3 pr-4 text-xs">
                    <span className="font-semibold text-[var(--ink)] block">{g.recipientName || "Valued Client"}</span>
                    <span className="text-[11px] font-mono text-[var(--ink-soft)]">{g.recipientEmail}</span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-[var(--ink-soft)] font-medium">
                    {g.senderName || "Studio"}
                  </td>
                  <td className="py-3 pr-4 text-xs font-bold">
                    {g.stripeCouponId ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
                        ⚡ Synced to Stripe
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border border-gray-500/40 bg-gray-500/10 text-gray-400">
                        Local DB Only
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right text-xs">
                    <button
                      type="button"
                      onClick={() => void handleDeleteGiftCard(g._id)}
                      className="px-2.5 py-1 rounded-lg border border-rose-500/30 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {giftCards.length === 0 && (
            <p className="py-8 text-center text-xs text-[var(--ink-soft)] italic">
              No digital gift cards issued yet.
            </p>
          )}
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateCoupon} className="w-full max-w-lg border border-[var(--border-color)] bg-[var(--background)] p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-[var(--ink)]">
                Create Discount Coupon (Stripe Synced)
              </h2>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {couponError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
                ⚠️ {couponError}
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SUMMER20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2.5 text-xs text-[var(--ink)] rounded-xl font-mono uppercase font-bold focus:outline-none focus:border-[#c8a86b]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block mb-1">
                  Discount Type
                </label>
                <select
                  value={couponType}
                  onChange={(e) => setCouponType(e.target.value as any)}
                  className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b]"
                >
                  <option value="percent">Percentage Off (%)</option>
                  <option value="fixed">Fixed Amount Off ($ CAD)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block mb-1">
                  Value *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={couponValue}
                  onChange={(e) => setCouponValue(parseFloat(e.target.value) || 0)}
                  className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2 text-xs font-mono text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block mb-1">
                Max Redemptions (Optional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Leave blank for unlimited"
                value={couponMaxRedemptions}
                onChange={(e) => setCouponMaxRedemptions(e.target.value)}
                className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2 text-xs text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="px-4 py-2 border border-[var(--border-color)] text-xs font-bold text-[var(--ink-soft)] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={couponSaving}
                className="btn-primary py-2 px-5 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {couponSaving ? "Syncing with Stripe..." : "⚡ Create & Sync with Stripe"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ISSUE MANUAL GIFT CARD MODAL */}
      {isGiftCardModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleIssueGiftCard} className="w-full max-w-lg border border-[var(--border-color)] bg-[var(--background)] p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-[var(--ink)]">
                Issue Manual Digital Gift Card
              </h2>
              <button
                type="button"
                onClick={() => setIsGiftCardModalOpen(false)}
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {giftError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
                ⚠️ {giftError}
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block mb-1">
                Gift Card Value (CAD $) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="5"
                value={giftAmount}
                onChange={(e) => setGiftAmount(parseFloat(e.target.value) || 0)}
                className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2 text-xs font-mono font-bold text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Johns"
                  value={giftRecipientName}
                  onChange={(e) => setGiftRecipientName(e.target.value)}
                  className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2 text-xs text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block mb-1">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="sarah@example.com"
                  value={giftRecipientEmail}
                  onChange={(e) => setGiftRecipientEmail(e.target.value)}
                  className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2 text-xs font-mono text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block mb-1">
                Personalized Message / Gift Note
              </label>
              <textarea
                rows={2}
                placeholder="Enjoy your facial treatment session!"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2 text-xs text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsGiftCardModalOpen(false)}
                className="px-4 py-2 border border-[var(--border-color)] text-xs font-bold text-[var(--ink-soft)] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={giftSaving}
                className="btn-primary py-2 px-5 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {giftSaving ? "Sending & Syncing..." : "🎁 Issue, Sync & Email Voucher"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
