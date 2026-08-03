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
  stripePromotionCodeId?: string;
  active: boolean;
  createdAt?: string;
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
  stripePromotionCodeId?: string;
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
  const [message, setMessage] = useState("");

  // Drawer details side panel state
  const [drawerItem, setDrawerItem] = useState<{
    type: "coupon" | "giftCard";
    item: CouponItem | GiftCardItem;
  } | null>(null);
  const [syncingStripe, setSyncingStripe] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

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

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  async function handleSyncCouponToStripe(couponId: string) {
    setSyncingStripe(true);
    try {
      const res = await fetch("/api/admin/coupon-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to sync with Stripe");

      const updatedCoupon: CouponItem = {
        _id: String(data.coupon._id),
        code: data.coupon.code,
        type: data.coupon.type,
        value: data.coupon.value,
        maxRedemptions: data.coupon.maxRedemptions,
        redemptionCount: data.coupon.redemptionCount || 0,
        expiresAt: data.coupon.expiresAt ? new Date(data.coupon.expiresAt).toISOString() : null,
        stripeCouponId: data.coupon.stripeCouponId || "",
        stripePromotionCodeId: data.coupon.stripePromotionCodeId || "",
        active: Boolean(data.coupon.active),
        createdAt: data.coupon.createdAt ? new Date(data.coupon.createdAt).toISOString() : undefined,
      };

      setCoupons((prev) => prev.map((c) => (c._id === couponId ? updatedCoupon : c)));
      if (drawerItem && drawerItem.item._id === couponId) {
        setDrawerItem({ type: "coupon", item: updatedCoupon });
      }
      showMsg(`Coupon '${updatedCoupon.code}' successfully synced to Stripe!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to sync coupon to Stripe");
    } finally {
      setSyncingStripe(false);
    }
  }

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
      showMsg("Discount Coupon created & synced with Stripe!");
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
      if (drawerItem && drawerItem.item._id === id) {
        setDrawerItem(null);
      }
      showMsg("Coupon deleted.");
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
        amountCad: giftAmount,
        recipientEmail: giftRecipientEmail,
        recipientName: giftRecipientName,
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
      showMsg("Digital Gift Card issued, synced to Stripe & emailed!");
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
      if (drawerItem && drawerItem.item._id === id) {
        setDrawerItem(null);
      }
      showMsg("Gift Card deleted.");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete gift card");
    }
  }

  const inputCls =
    "w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] transition-colors";

  return (
    <div className="space-y-6 text-[var(--ink)]">
      {/* Top Banner Header matching Categories & Quizzes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">
            🏷️ Coupons &amp; Gift Certificates
          </h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Manage Stripe-synced discount promo codes and issue digital gift certificates to studio clients. Click any code to view full details and Stripe sync metadata.
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
              className="btn-primary text-xs !py-2.5 !px-5 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span> Create Discount Coupon
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsGiftCardModalOpen(true)}
              className="btn-primary text-xs !py-2.5 !px-5 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>🎁</span> Issue Digital Gift Card
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
          ✓ {message}
        </div>
      )}

      {/* Standardized Tabs Selector */}
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
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--ink-soft)] uppercase font-bold tracking-wider text-[10px]">
                  <th className="p-4">Coupon Code</th>
                  <th className="p-4">Discount Value</th>
                  <th className="p-4">Redemptions</th>
                  <th className="p-4">Stripe Integration</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--ink-soft)] italic">
                      No discount coupons created yet. Click "+ Create Discount Coupon" above to build one.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => setDrawerItem({ type: "coupon", item: c })}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-mono font-bold text-sm">
                        <span className="px-2.5 py-1 rounded-md bg-black/10 dark:bg-white/10 text-[#c8a86b] hover:underline">
                          {c.code}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-sm text-[var(--ink)]">
                        {c.type === "percent" ? `${c.value}% OFF` : `$${c.value.toFixed(2)} CAD OFF`}
                      </td>
                      <td className="p-4 text-[var(--ink-soft)] font-medium">
                        {c.redemptionCount || 0} / {c.maxRedemptions ? c.maxRedemptions : "∞"}
                      </td>
                      <td className="p-4">
                        {c.stripeCouponId ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                            ⚡ Synced to Stripe
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleSyncCouponToStripe(c._id);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[#c8a86b]/40 bg-[#c8a86b]/10 text-[#c8a86b] hover:bg-[#c8a86b]/20 transition-all cursor-pointer"
                          >
                            ⚡ Sync to Stripe
                          </button>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrawerItem({ type: "coupon", item: c });
                          }}
                          className="px-3 py-1.5 border border-[var(--border-color)] text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[#c8a86b] rounded-xl transition-all cursor-pointer"
                        >
                          📋 Details
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteCoupon(c._id);
                          }}
                          className="px-3 py-1.5 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL GIFT CARDS */}
      {activeTab === "giftCards" && (
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--ink-soft)] uppercase font-bold tracking-wider text-[10px]">
                  <th className="p-4">Voucher Code</th>
                  <th className="p-4">Remaining Balance</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Sender</th>
                  <th className="p-4">Stripe Sync</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {giftCards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--ink-soft)] italic">
                      No digital gift cards issued yet. Click "Issue Digital Gift Card" to send one.
                    </td>
                  </tr>
                ) : (
                  giftCards.map((g) => (
                    <tr
                      key={g._id}
                      onClick={() => setDrawerItem({ type: "giftCard", item: g })}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-mono font-bold text-sm">
                        <span className="px-2.5 py-1 rounded-md bg-black/10 dark:bg-white/10 text-[#c8a86b] hover:underline">
                          {g.code}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-sm font-mono text-[var(--ink)]">
                        ${(g.remainingBalanceCents / 100).toFixed(2)} CAD
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-[var(--ink)] block">{g.recipientName || "Valued Client"}</span>
                        <span className="text-[11px] font-mono text-[var(--ink-soft)]">{g.recipientEmail}</span>
                      </td>
                      <td className="p-4 text-[var(--ink-soft)] font-medium">
                        {g.senderName || "Mari Esthetics Studio"}
                      </td>
                      <td className="p-4">
                        {g.stripeCouponId ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                            ⚡ Synced to Stripe
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/10 bg-black/10 text-[var(--ink-soft)]">
                            Local DB Only
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrawerItem({ type: "giftCard", item: g });
                          }}
                          className="px-3 py-1.5 border border-[var(--border-color)] text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[#c8a86b] rounded-xl transition-all cursor-pointer"
                        >
                          📋 Details
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteGiftCard(g._id);
                          }}
                          className="px-3 py-1.5 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PROMOTIONS DETAILS SIDE PANEL DRAWER ── */}
      {drawerItem && (
        <div className="fixed inset-0 z-[150] overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setDrawerItem(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[var(--card-bg)] border-l border-[var(--border-color)] text-[var(--ink)] shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#c8a86b]">
                      {drawerItem.type === "coupon" ? "Discount Coupon Details" : "Gift Voucher Details"}
                    </span>
                    <h2 className="text-xl font-bold font-mono text-[var(--ink)] flex items-center gap-2 mt-1">
                      <span>🏷️</span>
                      <span>{drawerItem.item.code}</span>
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerItem(null)}
                    className="p-1.5 rounded-xl border border-[var(--border-color)] text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Metadata Cards */}
                {drawerItem.type === "coupon" ? (
                  (() => {
                    const c = drawerItem.item as CouponItem;
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.02]">
                            <span className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block">Discount Value</span>
                            <span className="text-base font-extrabold text-[#c8a86b]">
                              {c.type === "percent" ? `${c.value}% OFF` : `$${c.value.toFixed(2)} CAD OFF`}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.02]">
                            <span className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block">Redemptions</span>
                            <span className="text-base font-extrabold text-[var(--ink)]">
                              {c.redemptionCount || 0} / {c.maxRedemptions ? c.maxRedemptions : "Unlimited"}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.02] space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#c8a86b] border-b border-[var(--border-color)]/50 pb-2">
                            ⚡ Stripe Integration &amp; Promo Code Sync
                          </h4>

                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--ink-soft)] font-medium">Stripe Status:</span>
                              {c.stripeCouponId ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                                  ⚡ Synced to Stripe API
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-rose-500/30 bg-rose-500/10 text-rose-400">
                                  ○ Local Database Only
                                </span>
                              )}
                            </div>

                            {c.stripeCouponId ? (
                              <>
                                <div className="space-y-1 pt-1">
                                  <span className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block">
                                    Stripe Coupon ID:
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <code className="px-2 py-1 rounded bg-black/10 dark:bg-white/10 text-xs font-mono text-[var(--ink)] break-all flex-1">
                                      {c.stripeCouponId}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(c.stripeCouponId!, "couponId")}
                                      className="px-2 py-1 border border-[var(--border-color)] rounded-lg text-[10px] font-bold hover:border-[#c8a86b] cursor-pointer"
                                    >
                                      {copiedKey === "couponId" ? "✓ Copied" : "📋 Copy"}
                                    </button>
                                  </div>
                                </div>

                                {c.stripePromotionCodeId && (
                                  <div className="space-y-1 pt-1">
                                    <span className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block">
                                      Stripe Promo Code ID:
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <code className="px-2 py-1 rounded bg-black/10 dark:bg-white/10 text-xs font-mono text-[var(--ink)] break-all flex-1">
                                        {c.stripePromotionCodeId}
                                      </code>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(c.stripePromotionCodeId!, "promoId")}
                                        className="px-2 py-1 border border-[var(--border-color)] rounded-lg text-[10px] font-bold hover:border-[#c8a86b] cursor-pointer"
                                      >
                                        {copiedKey === "promoId" ? "✓ Copied" : "📋 Copy"}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="pt-2">
                                <button
                                  type="button"
                                  disabled={syncingStripe}
                                  onClick={() => void handleSyncCouponToStripe(c._id)}
                                  className="w-full btn-primary text-xs !py-2 font-bold cursor-pointer disabled:opacity-40"
                                >
                                  {syncingStripe ? "Syncing with Stripe..." : "⚡ Sync with Stripe Now"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.02] space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[var(--ink-soft)]">Promo Code:</span>
                            <span className="font-mono font-bold text-[#c8a86b]">{c.code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--ink-soft)]">Type:</span>
                            <span className="font-semibold text-[var(--ink)] uppercase">{c.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--ink-soft)]">Status:</span>
                            <span className="font-semibold text-emerald-400">Active</span>
                          </div>
                          {c.expiresAt && (
                            <div className="flex justify-between">
                              <span className="text-[var(--ink-soft)]">Expires On:</span>
                              <span className="font-mono text-[var(--ink)]">{new Date(c.expiresAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  (() => {
                    const g = drawerItem.item as GiftCardItem;
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.02]">
                            <span className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block">Remaining Balance</span>
                            <span className="text-base font-extrabold font-mono text-emerald-400">
                              ${(g.remainingBalanceCents / 100).toFixed(2)} CAD
                            </span>
                          </div>
                          <div className="p-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.02]">
                            <span className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block">Initial Value</span>
                            <span className="text-base font-extrabold font-mono text-[var(--ink)]">
                              ${(g.initialBalanceCents / 100).toFixed(2)} CAD
                            </span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.02] space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#c8a86b] border-b border-[var(--border-color)]/50 pb-2">
                            👤 Recipient &amp; Sender Info
                          </h4>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[var(--ink-soft)]">Recipient Name:</span>
                              <span className="font-semibold text-[var(--ink)]">{g.recipientName || "Valued Client"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--ink-soft)]">Recipient Email:</span>
                              <span className="font-mono text-[var(--ink)]">{g.recipientEmail}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--ink-soft)]">Issued By:</span>
                              <span className="font-semibold text-[var(--ink)]">{g.senderName || "Mari Esthetics Studio"}</span>
                            </div>
                          </div>
                        </div>

                        {g.stripeCouponId && (
                          <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.02] space-y-2 text-xs">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#c8a86b]">
                              ⚡ Stripe Integration
                            </h4>
                            <div className="flex items-center gap-2 pt-1">
                              <code className="px-2 py-1 rounded bg-black/10 dark:bg-white/10 text-xs font-mono text-[var(--ink)] break-all flex-1">
                                {g.stripeCouponId}
                              </code>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(g.stripeCouponId!, "giftStripeId")}
                                className="px-2 py-1 border border-[var(--border-color)] rounded-lg text-[10px] font-bold hover:border-[#c8a86b] cursor-pointer"
                              >
                                {copiedKey === "giftStripeId" ? "✓ Copied" : "📋 Copy"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-6 border-t border-[var(--border-color)] flex gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(drawerItem.item.code, "codeOnly")}
                  className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-xl text-xs font-bold text-[var(--ink)] hover:border-[#c8a86b] cursor-pointer"
                >
                  {copiedKey === "codeOnly" ? "✓ Code Copied!" : "📋 Copy Code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (drawerItem.type === "coupon") {
                      void handleDeleteCoupon(drawerItem.item._id);
                    } else {
                      void handleDeleteGiftCard(drawerItem.item._id);
                    }
                  }}
                  className="px-4 py-2 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <form onSubmit={handleCreateCoupon} className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl max-w-lg w-full text-left space-y-5 shadow-2xl relative animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <h3 className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--ink)]">
                Create Discount Coupon (Stripe Synced)
              </h3>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] px-2.5 py-1 rounded-lg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {couponError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
                ⚠️ {couponError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SUMMER20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className={`${inputCls} font-mono uppercase font-bold`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Discount Type
                </label>
                <select
                  value={couponType}
                  onChange={(e) => setCouponType(e.target.value as any)}
                  className={inputCls}
                  style={{ backgroundColor: "var(--card-bg)" }}
                >
                  <option value="percent">Percentage Off (%)</option>
                  <option value="fixed">Fixed Amount Off ($ CAD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Value *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={couponValue}
                  onChange={(e) => setCouponValue(parseFloat(e.target.value) || 0)}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                Max Redemptions (Optional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Leave blank for unlimited"
                value={couponMaxRedemptions}
                onChange={(e) => setCouponMaxRedemptions(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="px-4 py-2 text-xs border border-[var(--border-color)] rounded-xl text-[var(--ink-soft)] font-semibold hover:text-[var(--ink)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={couponSaving}
                className="btn-primary text-xs !py-2.5 !px-6 disabled:opacity-40 font-bold cursor-pointer"
              >
                {couponSaving ? "Syncing with Stripe..." : "⚡ Create & Sync with Stripe"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ISSUE MANUAL GIFT CARD MODAL */}
      {isGiftCardModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <form onSubmit={handleIssueGiftCard} className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl max-w-lg w-full text-left space-y-5 shadow-2xl relative animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <h3 className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--ink)]">
                Issue Manual Digital Gift Card
              </h3>
              <button
                type="button"
                onClick={() => setIsGiftCardModalOpen(false)}
                className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] px-2.5 py-1 rounded-lg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {giftError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
                ⚠️ {giftError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                Gift Card Value (CAD $) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="5"
                value={giftAmount}
                onChange={(e) => setGiftAmount(parseFloat(e.target.value) || 0)}
                className={`${inputCls} font-mono font-bold`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Recipient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Johns"
                  value={giftRecipientName}
                  onChange={(e) => setGiftRecipientName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="sarah@example.com"
                  value={giftRecipientEmail}
                  onChange={(e) => setGiftRecipientEmail(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                Personalized Message / Gift Note
              </label>
              <textarea
                rows={2}
                placeholder="Enjoy your facial treatment session!"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsGiftCardModalOpen(false)}
                className="px-4 py-2 text-xs border border-[var(--border-color)] rounded-xl text-[var(--ink-soft)] font-semibold hover:text-[var(--ink)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={giftSaving}
                className="btn-primary text-xs !py-2.5 !px-6 disabled:opacity-40 font-bold cursor-pointer"
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
