"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCad } from "@/lib/money";

export function BookingActions({
  bookingId,
  status,
  balanceDueCents,
  onUpdate,
}: {
  bookingId: string;
  status: string;
  balanceDueCents: number;
  onUpdate?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustMethod, setAdjustMethod] = useState<"cash" | "etransfer" | "stripe">(
    "cash",
  );
  const [error, setError] = useState("");

  async function confirmEtransfer(approve: boolean) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/bookings/${bookingId}/confirm-etransfer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approve, note }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.refresh();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(next: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      router.refresh();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function sendBalanceLink() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        alert("Balance payment link copied to clipboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function recordAdjustment() {
    setLoading(true);
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
      if (!res.ok) throw new Error(data.error || "Failed");
      setAdjustAmount("");
      router.refresh();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-w-[220px] flex-col gap-2 text-sm">
      {status === "held" && (
        <>
          <input
            placeholder="Optional note"
            className="border border-white/15 bg-black/20 px-2 py-1.5 text-white"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="button"
            disabled={loading}
            className="bg-[#2f5d4a] hover:bg-[#3b725b] active:bg-[#214335] disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-white transition-all duration-200 cursor-pointer font-medium"
            onClick={() => void confirmEtransfer(true)}
          >
            Confirm e-Transfer
          </button>
          <button
            type="button"
            disabled={loading}
            className="border border-white/20 hover:border-white/40 hover:text-white hover:bg-white/5 active:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-white/80 transition-all duration-200 cursor-pointer"
            onClick={() => void confirmEtransfer(false)}
          >
            Reject / release
          </button>
        </>
      )}
      {status === "confirmed" && (
        <button
          type="button"
          disabled={loading}
          className="bg-[#2f5d4a] hover:bg-[#3b725b] active:bg-[#214335] disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-white transition-all duration-200 cursor-pointer font-medium"
          onClick={() => void setStatus("completed")}
        >
          Mark completed
        </button>
      )}
      {balanceDueCents > 0 && (
        <button
          type="button"
          disabled={loading}
          className="border border-white/20 hover:border-white/40 hover:text-white hover:bg-white/5 active:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-white/80 transition-all duration-200 cursor-pointer"
          onClick={() => void sendBalanceLink()}
        >
          Copy Stripe balance link ({formatCad(balanceDueCents)})
        </button>
      )}
      <div className="mt-2 flex gap-1">
        <input
          placeholder="Adj $"
          className="w-20 border border-white/15 bg-black/20 px-2 py-1.5 text-white"
          value={adjustAmount}
          onChange={(e) => setAdjustAmount(e.target.value)}
        />
        <select
          className="border border-white/15 bg-black/20 px-1 text-white"
          value={adjustMethod}
          onChange={(e) =>
            setAdjustMethod(e.target.value as "cash" | "etransfer" | "stripe")
          }
        >
          <option value="cash">Cash</option>
          <option value="etransfer">E-Transfer</option>
          <option value="stripe">Stripe</option>
        </select>
        <button
          type="button"
          disabled={loading || !adjustAmount}
          className="border border-white/20 hover:border-white/40 hover:text-white hover:bg-white/5 active:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed px-2 text-white/80 transition-all duration-200 cursor-pointer"
          onClick={() => void recordAdjustment()}
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-[#e8a0a2]">{error}</p>}
    </div>
  );
}
