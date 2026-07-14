"use client";

import { useState } from "react";

export function TipButton({ bookingId }: { bookingId: string }) {
  const [amount, setAmount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function tip() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amountCents: Math.round(Number(amount) * 100),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        type="number"
        min="1"
        step="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-28 border border-[var(--line)] bg-white px-2 py-2 text-sm"
        aria-label="Tip amount CAD"
      />
      <button
        type="button"
        className="btn-ghost !py-2 !px-3 text-sm"
        disabled={loading}
        onClick={() => void tip()}
      >
        Tip via Stripe
      </button>
      {error && <span className="text-xs text-blush">{error}</span>}
    </div>
  );
}
