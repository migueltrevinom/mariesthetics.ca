"use client";

import { useState } from "react";
import { formatCad } from "@/lib/money";

import { LuxuryInvoiceReceipt } from "@/components/invoice/LuxuryInvoiceReceipt";
import { ConfettiEffect } from "@/components/ui/ConfettiEffect";

export type PublicStudioCharge = {
  id?: string;
  number?: string;
  baseAmountCents: number;
  tipPercent: number;
  tipCents: number;
  totalCents: number;
  clientFirstName: string;
  clientFullName?: string;
  clientEmail?: string;
  clientPhone?: string;
  description: string;
  status: string;
  checkoutUrl: string;
  paidAt: string | null;
  createdAt: string | null;
  stripeSessionId?: string;
  booking?: {
    id: string;
    serviceName: string;
    durationMin: number;
    servicePriceCents: number;
    start: string | null;
    end: string | null;
    depositCents: number;
    paidToDateCents: number;
    balanceDueCents: number;
    depositMethod: string;
  } | null;
  reconciliation?: {
    treatmentTotalCents: number;
    depositPaidCents?: number;
    balancePaidCents?: number;
    tipPercent?: number;
    tipCents?: number;
    discountCents?: number;
    totalChargedTodayCents?: number;
    totalPaidToDateCents: number;
    balanceDueCents: number;
  };
};

const TIP_CHOICES = [
  { percent: 10, label: "10%" },
  { percent: 15, label: "15%" },
  { percent: 20, label: "20%" },
  { percent: 0, label: "No tip" },
] as const;

export function StudioPayTerminal({
  charge: initialCharge,
  token,
}: {
  charge: PublicStudioCharge | null;
  token: string;
}) {
  const [charge, setCharge] = useState(initialCharge);
  const [selectedTipPercent, setSelectedTipPercent] = useState<number>(initialCharge?.tipPercent ?? 10);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  if (!charge || !token) {
    return (
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-sm text-[var(--ink-soft)]">No payment is waiting right now.</p>
      </section>
    );
  }

  if (charge.status === "paid") {
    const when = charge.paidAt || charge.createdAt || new Date().toISOString();
    const invoiceNumber = charge.number || `INV-SC-${(charge.id || "").slice(-8).toUpperCase()}`;

    const rec = charge.reconciliation || {
      treatmentTotalCents: charge.booking?.servicePriceCents || charge.baseAmountCents,
      depositPaidCents: charge.booking?.depositCents || 0,
      balancePaidCents: charge.baseAmountCents,
      tipPercent: charge.tipPercent,
      tipCents: charge.tipCents,
      discountCents: 0,
      totalChargedTodayCents: charge.totalCents,
      totalPaidToDateCents: (charge.booking?.depositCents || 0) + charge.totalCents,
      balanceDueCents: 0,
    };

    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-12 sm:py-16 relative overflow-hidden print:bg-white print:p-0">
        <div className="aurora pointer-events-none print:hidden fixed inset-0 opacity-70" />
        <ConfettiEffect mode="fixed" />
        <section className="relative z-10 mx-auto max-w-2xl">
          <LuxuryInvoiceReceipt
            number={invoiceNumber}
            date={when}
            status="PAID"
            paymentMethod="Stripe Online Card"
            stripeSessionId={charge.stripeSessionId}
            client={{
              name: charge.clientFullName || charge.clientFirstName || "Valued Client",
              email: charge.clientEmail || "",
              phone: charge.clientPhone || "",
            }}
            appointment={
              charge.booking
                ? {
                    id: charge.booking.id,
                    serviceName: charge.booking.serviceName,
                    durationMin: charge.booking.durationMin,
                    start: charge.booking.start,
                    end: charge.booking.end,
                  }
                : null
            }
            reconciliation={rec}
            description={charge.description}
            portalUrl="/portal"
          />
        </section>
      </div>
    );
  }

  // Calculate tip and total in real-time on the frontend without server roundtrips
  const baseAmountCents = charge.baseAmountCents;
  const currentTipCents = Math.round((baseAmountCents * selectedTipPercent) / 100);
  const currentTotalCents = baseAmountCents + currentTipCents;

  async function handlePay() {
    if (paying || !charge) return;
    setPaying(true);
    setError("");
    try {
      const res = await fetch("/api/public/studio-charge/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tipPercent: selectedTipPercent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not connect to payment gateway");
      const redirectUrl = data.checkoutUrl || data.charge?.checkoutUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error("Payment link is unavailable. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect to checkout");
      setPaying(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] px-6 py-10 text-center shadow-xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#c8a86b]">Amount due</p>
        {charge.clientFirstName ? (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">{charge.clientFirstName}</p>
        ) : null}
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{charge.description}</p>
        <p className="mt-6 font-[family-name:var(--font-display)] text-7xl leading-none text-[var(--ink)] sm:text-8xl">
          {formatCad(charge.baseAmountCents)}
        </p>
        <div className="mt-10 grid grid-cols-4 gap-2">
          {TIP_CHOICES.map((choice) => {
            const selected = selectedTipPercent === choice.percent;
            return (
              <button
                key={choice.percent}
                type="button"
                disabled={paying}
                onClick={() => setSelectedTipPercent(choice.percent)}
                className={`cursor-pointer rounded-2xl border px-2 py-4 text-sm font-semibold transition disabled:opacity-50 ${
                  selected
                    ? "border-[#c8a86b] bg-[#c8a86b] text-[#1c1814]"
                    : "border-[var(--border-color)] text-[var(--ink)] hover:border-[#c8a86b]/40"
                }`}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">To pay</p>
        <p className="mt-1 font-mono text-3xl text-[var(--ink)]">{formatCad(currentTotalCents)}</p>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          {selectedTipPercent > 0
            ? `Includes ${formatCad(currentTipCents)} tip (${selectedTipPercent}%)`
            : "No tip included"}
        </p>
        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        <button
          type="button"
          onClick={() => void handlePay()}
          disabled={paying}
          className="btn-primary mt-8 flex items-center justify-center gap-2 w-full cursor-pointer disabled:opacity-60"
        >
          {paying ? (
            <>
              <svg className="animate-spin h-4 w-4 text-[#1c1814]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Connecting to Checkout...</span>
            </>
          ) : (
            <span>Pay {formatCad(currentTotalCents)}</span>
          )}
        </button>
      </div>
    </section>
  );
}
