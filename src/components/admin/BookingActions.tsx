"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatCad } from "@/lib/money";

export function BookingActions({
  bookingId,
  status,
  balanceDueCents,
  allowLateReschedule = false,
  onUpdate,
}: {
  bookingId: string;
  status: string;
  balanceDueCents: number;
  allowLateReschedule?: boolean;
  onUpdate?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingLink, setFetchingLink] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [isLateRescheduleAllowed, setIsLateRescheduleAllowed] = useState(allowLateReschedule);
  const [note, setNote] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustMethod, setAdjustMethod] = useState<"cash" | "etransfer">("cash");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sendingReviewReq, setSendingReviewReq] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);

  // Payment Link State
  const [paymentUrl, setPaymentUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Auto-fetch existing active payment link for this booking on mount
  useEffect(() => {
    let isMounted = true;
    if (bookingId && balanceDueCents > 0) {
      setFetchingLink(true);
      fetch(`/api/payments/balance?bookingId=${bookingId}`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && data.url) {
            setPaymentUrl(data.url);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setFetchingLink(false);
        });
    } else {
      setPaymentUrl("");
    }
    return () => {
      isMounted = false;
    };
  }, [bookingId, balanceDueCents]);

  async function confirmEtransfer(approve: boolean) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(
        `/api/admin/bookings/${bookingId}/confirm-etransfer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approve, note }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm e-Transfer");
      setMessage(approve ? "e-Transfer deposit confirmed!" : "Deposit rejected");
      router.refresh();
      onUpdate?.();
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(next: string) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      setMessage(`Booking marked as ${next}!`);
      router.refresh();
      onUpdate?.();
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function generateBalanceLink(forceNew = false) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/payments/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, forceNew }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate payment link");
      if (data.url) {
        setPaymentUrl(data.url);
        setMessage(forceNew ? "New Stripe payment link created!" : "Stripe payment link retrieved!");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate payment link");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!paymentUrl) return;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }

  async function handleSendEmailLink() {
    if (!paymentUrl) return;
    setEmailing(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/bookings/send-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, paymentUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      setMessage(data.message || "Payment link sent to client's email!");
    } catch (err: any) {
      setError(err.message || "Failed to send email");
    } finally {
      setEmailing(false);
    }
  }

  async function recordAdjustment() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/payments/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amountCents: Math.round(Number(adjustAmount) * 100),
          method: adjustMethod,
          note: "Manual adjustment",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record adjustment");
      setAdjustAmount("");
      setMessage("Adjustment recorded successfully!");
      router.refresh();
      onUpdate?.();
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReviewRequest() {
    setSendingReviewReq(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/reviews/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send review request");
      setMessage(data.message || "Review invitation sent to client email!");
    } catch (err: any) {
      setError(err.message || "Failed to send review request");
    } finally {
      setSendingReviewReq(false);
    }
  }

  async function handleSendSmsReminder() {
    setSendingSms(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/send-sms-reminder`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send SMS reminder");
      setMessage(data.message || "SMS appointment reminder sent to client!");
    } catch (err: any) {
      setError(err.message || "Failed to send SMS reminder");
    } finally {
      setSendingSms(false);
    }
  }

  async function toggleAllowLateReschedule(nextVal: boolean) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowLateReschedule: nextVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update reschedule policy");
      setIsLateRescheduleAllowed(nextVal);
      setMessage(nextVal ? "🔓 Courtesy 24h reschedule policy bypass enabled!" : "🔒 Standard 24h reschedule policy restored.");
      router.refresh();
      onUpdate?.();
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 text-sm text-left">
      {/* Notifications */}
      {message && (
        <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          ✓ {message}
        </div>
      )}
      {error && (
        <div className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Courtesy 24h Reschedule Bypass Switch */}
      <div className="p-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[var(--ink)] block">
            {isLateRescheduleAllowed ? "🔓 24h Reschedule Waived" : "🔒 Standard 24h Policy"}
          </span>
          <span className="text-[10px] text-[var(--ink-soft)] block">
            {isLateRescheduleAllowed ? "Client can reschedule for free anytime" : "Client forfeits deposit if under 24h"}
          </span>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void toggleAllowLateReschedule(!isLateRescheduleAllowed)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            isLateRescheduleAllowed
              ? "border border-amber-500/40 bg-amber-500/20 text-amber-400"
              : "border border-[var(--border-color)] bg-black/10 dark:bg-white/10 text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          {isLateRescheduleAllowed ? "Disable Bypass" : "Waive 24h Policy"}
        </button>
      </div>

      {/* Held e-Transfer Approval */}
      {status === "held" && (
        <div className="space-y-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <label className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider block">
            e-Transfer Deposit Approval
          </label>
          <input
            placeholder="Optional verification note"
            style={{ backgroundColor: "var(--card-bg)" }}
            className="w-full border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              className="flex-1 bg-[#2f5d4a] hover:bg-[#3b725b] text-white px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              onClick={() => void confirmEtransfer(true)}
            >
              Confirm Deposit
            </button>
            <button
              type="button"
              disabled={loading}
              className="border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              onClick={() => void confirmEtransfer(false)}
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Mark Completed Button */}
      {status === "confirmed" && (
        <button
          type="button"
          disabled={loading}
          className="btn-primary w-full py-2.5 shadow-md font-bold text-xs flex items-center justify-center gap-2"
          onClick={() => void setStatus("completed")}
        >
          <span>✓ Mark Appointment Completed</span>
        </button>
      )}

      {/* SMS & Review Link Triggers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          disabled={loading || sendingSms}
          onClick={() => void handleSendSmsReminder()}
          className="w-full border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 py-2.5 px-3 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span>{sendingSms ? "Sending SMS..." : "📱 Send SMS Reminder"}</span>
        </button>

        <button
          type="button"
          disabled={loading || sendingReviewReq}
          onClick={() => void handleSendReviewRequest()}
          className="w-full border border-[#c8a86b]/40 bg-[#c8a86b]/10 hover:bg-[#c8a86b]/20 text-[#c8a86b] py-2.5 px-3 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span>{sendingReviewReq ? "Sending Email..." : "⭐ Send Review Email"}</span>
        </button>
      </div>

      {/* Balance Payment Link Generator & Actions */}
      {balanceDueCents > 0 && (
        <div className="border border-[var(--border-color)] bg-black/5 dark:bg-white/5 p-3.5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
              Payment Link Suite
            </span>
            <span className="text-xs font-bold text-[#c8a86b]">
              Due: {formatCad(balanceDueCents)}
            </span>
          </div>

          {fetchingLink ? (
            <div className="py-2.5 px-4 rounded-xl bg-black/10 dark:bg-white/5 border border-[var(--border-color)] text-xs text-[var(--ink-soft)] italic animate-pulse text-center">
              Checking for existing payment link...
            </div>
          ) : !paymentUrl ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void generateBalanceLink(false)}
              className="w-full bg-[#2f5d4a] hover:bg-[#3b725b] text-white py-2.5 px-4 text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>💳 Generate Stripe Payment Link ({formatCad(balanceDueCents)})</span>
            </button>
          ) : (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <div className="p-2 rounded-xl bg-black/10 dark:bg-black/30 border border-[var(--border-color)] flex items-center justify-between gap-2">
                <input
                  type="text"
                  readOnly
                  value={paymentUrl}
                  style={{ backgroundColor: "transparent" }}
                  className="w-full text-xs font-mono text-[#c8a86b] focus:outline-none select-all truncate"
                />
                <button
                  type="button"
                  title="Generate a new fresh payment link"
                  disabled={loading}
                  onClick={() => void generateBalanceLink(true)}
                  className="text-[10px] text-[var(--ink-soft)] hover:text-[#c8a86b] underline whitespace-nowrap shrink-0"
                >
                  🔄 New Link
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopyLink()}
                  className="border border-[#c8a86b]/40 text-[#c8a86b] hover:bg-[#c8a86b]/10 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{copied ? "✓ Copied!" : "📋 Copy (WhatsApp/SMS)"}</span>
                </button>

                <button
                  type="button"
                  disabled={emailing}
                  onClick={() => void handleSendEmailLink()}
                  className="bg-[#2f5d4a] hover:bg-[#3b725b] text-white py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <span>{emailing ? "Sending..." : "📧 Send to Email"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Balance Adjustment */}
      <div className="border border-[var(--border-color)] p-3 rounded-2xl space-y-2 bg-black/5 dark:bg-black/20">
        <label className="text-[10px] uppercase font-bold text-[var(--ink-soft)] tracking-wider block">
          Record Cash / e-Transfer Payment
        </label>
        <div className="flex gap-2">
          <input
            placeholder="Amount $"
            style={{ backgroundColor: "var(--card-bg)" }}
            className="w-24 border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl font-mono"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
          />
          <select
            style={{ backgroundColor: "var(--card-bg)" }}
            className="border border-[var(--border-color)] px-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl flex-1 cursor-pointer"
            value={adjustMethod}
            onChange={(e) =>
              setAdjustMethod(e.target.value as "cash" | "etransfer")
            }
          >
            <option value="cash" className="bg-[var(--card-bg)] text-[var(--ink)]">💵 Cash</option>
            <option value="etransfer" className="bg-[var(--card-bg)] text-[var(--ink)]">🏦 e-Transfer</option>
          </select>
          <button
            type="button"
            disabled={loading || !adjustAmount}
            className="btn-primary text-xs px-3 py-2 font-bold disabled:opacity-50"
            onClick={() => void recordAdjustment()}
          >
            Record
          </button>
        </div>
      </div>
    </div>
  );
}
