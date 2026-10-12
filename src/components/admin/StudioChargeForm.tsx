"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { formatCad } from "@/lib/money";

type AdminStudioCharge = {
  id: string;
  clientName: string;
  clientEmail: string;
  description: string;
  status: string;
  baseAmountCents: number;
  tipPercent: number;
  tipCents: number;
  totalCents: number;
  paidAt: string | null;
  createdAt: string | null;
};

function tipLabel(charge: AdminStudioCharge) {
  if (charge.tipPercent === 0) return "No tip";
  return `${charge.tipPercent}% · ${formatCad(charge.tipCents)}`;
}

export function StudioChargeForm() {
  const [amountCad, setAmountCad] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const [charges, setCharges] = useState<AdminStudioCharge[]>([]);
  const [listError, setListError] = useState("");

  const loadCharges = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payments/studio-charge");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load charges");
      setCharges(data.charges ?? []);
      setListError("");
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : "Failed to load charges");
    }
  }, []);

  useEffect(() => {
    void loadCharges();
  }, [loadCharges]);

  const hasOpen = charges.some((charge) => charge.status === "open");
  useEffect(() => {
    if (!hasOpen) return;
    const id = window.setInterval(() => {
      void loadCharges();
    }, 4000);
    return () => window.clearInterval(id);
  }, [hasOpen, loadCharges]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setLive(false);
    try {
      const res = await fetch("/api/admin/payments/studio-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCad: Number(amountCad),
          clientName,
          clientEmail,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start the charge");
      setLive(true);
      setAmountCad("");
      setDescription("");
      await loadCharges();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start the charge");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5"
    >
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">In-studio charge</h2>
      <p className="mt-1 text-xs text-[var(--ink-soft)]">
        Shows on the landing page with a 10% tip selected. Starting a new charge replaces the one that is still open.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-[var(--ink-soft)]">
          Base amount (CAD)
          <input
            required
            type="number"
            min="0.50"
            step="0.01"
            value={amountCad}
            onChange={(e) => setAmountCad(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--ink)]"
          />
        </label>
        <label className="block text-xs text-[var(--ink-soft)]">
          Client email
          <input
            required
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--ink)]"
          />
        </label>
        <label className="block text-xs text-[var(--ink-soft)]">
          Client name
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--ink)]"
          />
        </label>
        <label className="block text-xs text-[var(--ink-soft)]">
          Invoice description
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Facial"
            className="mt-1 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--ink)]"
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      {live ? (
        <p className="mt-3 text-sm text-emerald-400">
          Live on the landing page. The tip below updates when the customer chooses one.{" "}
          <a href="/pay" className="underline">Open the pay screen</a>
        </p>
      ) : null}
      <button type="submit" disabled={saving} className="btn-primary mt-4 cursor-pointer disabled:opacity-50">
        {saving ? "Opening checkout..." : "Show on landing page"}
      </button>
    </form>

    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5">
      <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">Recent in-studio charges</h3>
      {listError ? <p className="mt-3 text-sm text-rose-400">{listError}</p> : null}
      {charges.length === 0 && !listError ? (
        <p className="mt-3 text-xs text-[var(--ink-soft)]">No in-studio charges yet.</p>
      ) : null}
      {charges.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--ink)]">
            <thead className="border-b border-[var(--border-color)] text-[var(--ink-soft)]/75">
              <tr>
                <th className="py-2.5 pr-4 text-xs font-bold uppercase">When</th>
                <th className="py-2.5 pr-4 text-xs font-bold uppercase">Client</th>
                <th className="py-2.5 pr-4 text-xs font-bold uppercase">Base</th>
                <th className="py-2.5 pr-4 text-xs font-bold uppercase">Tip</th>
                <th className="py-2.5 pr-4 text-xs font-bold uppercase">Total</th>
                <th className="py-2.5 text-xs font-bold uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((charge) => (
                <tr key={charge.id} className="border-b border-[var(--border-color)]/50">
                  <td className="py-3 pr-4 font-mono text-xs text-[var(--ink-soft)]">
                    {charge.createdAt ? format(new Date(charge.createdAt), "PP p") : "—"}
                  </td>
                  <td className="py-3 pr-4 text-xs">
                    <span className="font-semibold">{charge.clientName || "Client"}</span>
                    <span className="block font-normal text-[var(--ink-soft)]">{charge.description}</span>
                    {charge.clientEmail ? (
                      <span className="block font-mono text-[11px] font-normal text-[var(--ink-soft)]">{charge.clientEmail}</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{formatCad(charge.baseAmountCents)}</td>
                  <td className="py-3 pr-4 text-xs font-semibold">{tipLabel(charge)}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{formatCad(charge.totalCents)}</td>
                  <td className="py-3 text-[10px] font-extrabold uppercase tracking-wider">{charge.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
    </div>
  );
}
