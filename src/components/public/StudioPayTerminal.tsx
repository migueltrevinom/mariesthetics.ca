"use client";

import { useState } from "react";
import { formatCad } from "@/lib/money";

export type PublicStudioCharge = {
  id: string;
  baseAmountCents: number;
  tipPercent: number;
  tipCents: number;
  totalCents: number;
  clientName: string;
  clientEmail: string;
  description: string;
  status: string;
  checkoutUrl: string;
  paidAt: string | null;
  createdAt: string | null;
};

const TIP_CHOICES = [
  { percent: 10, label: "10%" },
  { percent: 15, label: "15%" },
  { percent: 20, label: "20%" },
  { percent: 0, label: "No tip" },
] as const;

export function StudioPayTerminal({
  charge: initialCharge,
  variant,
}: {
  charge: PublicStudioCharge | null;
  variant: "landing" | "page";
}) {
  const [charge, setCharge] = useState(initialCharge);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  if (!charge || (variant === "landing" && charge.status !== "open")) {
    if (variant === "landing") return null;
    return (
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-sm text-[var(--ink-soft)]">No payment is waiting right now.</p>
      </section>
    );
  }

  if (charge.status === "paid") {
    const when = charge.paidAt ? new Date(charge.paidAt) : new Date();
    return (
      <section className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 print:border-0 print:bg-white print:text-black">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#c8a86b] print:text-black">Mari Esthetics</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] print:text-black">Invoice</h1>
          <p className="mt-2 text-xs text-[var(--ink-soft)] print:text-black">
            {when.toLocaleString("en-CA", { timeZone: "America/Edmonton" })}
            <br />
            {charge.id}
          </p>
          <p className="mt-6 text-sm text-[var(--ink)] print:text-black">
            {charge.clientName || "Client"}
            {charge.clientEmail ? <><br />{charge.clientEmail}</> : null}
          </p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-[var(--border-color)] pb-3 print:border-black/10">
              <dt>{charge.description}</dt>
              <dd className="font-mono">{formatCad(charge.baseAmountCents)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[var(--border-color)] pb-3 print:border-black/10">
              <dt>Tip ({charge.tipPercent}%)</dt>
              <dd className="font-mono">{formatCad(charge.tipCents)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-base font-semibold">
              <dt>Total paid</dt>
              <dd className="font-mono">{formatCad(charge.totalCents)}</dd>
            </div>
          </dl>
          <p className="mt-6 text-xs text-[var(--ink-soft)] print:hidden">A copy of this invoice was sent by email.</p>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-primary mt-6 w-full cursor-pointer print:hidden"
          >
            Download invoice
          </button>
        </div>
      </section>
    );
  }

  async function selectTip(tipPercent: number) {
    if (!charge || tipPercent === charge.tipPercent || updating) return;
    setUpdating(true);
    setError("");
    try {
      const res = await fetch("/api/public/studio-charge/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chargeId: charge.id, tipPercent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the tip");
      setCharge(data.charge);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update the tip");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <section className={variant === "landing" ? "mx-auto max-w-xl px-6 py-16" : "mx-auto max-w-xl px-6 py-16"}>
      <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] px-6 py-10 text-center shadow-xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#c8a86b]">Amount due</p>
        {charge.clientName ? (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">{charge.clientName}</p>
        ) : null}
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{charge.description}</p>
        <p className="mt-6 font-[family-name:var(--font-display)] text-7xl leading-none text-[var(--ink)] sm:text-8xl">
          {formatCad(charge.baseAmountCents)}
        </p>
        <div className="mt-10 grid grid-cols-4 gap-2">
          {TIP_CHOICES.map((choice) => {
            const selected = charge.tipPercent === choice.percent;
            return (
              <button
                key={choice.percent}
                type="button"
                disabled={updating}
                onClick={() => void selectTip(choice.percent)}
                className={`cursor-pointer rounded-2xl border px-2 py-4 text-sm font-semibold transition disabled:opacity-50 ${
                  selected
                    ? "border-[#c8a86b] bg-[#c8a86b] text-[#1c1814]"
                    : "border-[var(--border-color)] text-[var(--ink)]"
                }`}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">To pay</p>
        <p className="mt-1 font-mono text-3xl text-[var(--ink)]">{formatCad(charge.totalCents)}</p>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Includes {formatCad(charge.tipCents)} tip
        </p>
        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
        {charge.checkoutUrl ? (
          <a
            href={updating ? undefined : charge.checkoutUrl}
            aria-disabled={updating}
            className={`btn-primary mt-8 block w-full ${updating ? "pointer-events-none opacity-50" : ""}`}
          >
            {updating ? "Updating amount..." : `Pay ${formatCad(charge.totalCents)}`}
          </a>
        ) : (
          <p className="mt-8 text-sm text-[var(--ink-soft)]">The payment link is not ready yet.</p>
        )}
      </div>
    </section>
  );
}
