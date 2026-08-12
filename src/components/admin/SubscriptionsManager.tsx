"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { formatCad } from "@/lib/money";

export interface ServiceOption {
  _id: string;
  name: string;
  category?: string;
  priceCents: number;
}

export interface SubscriptionPlanItem {
  _id: string;
  name: string;
  description: string;
  interval: "month" | "year";
  priceCents: number;
  billingNote?: string;
  includedServiceIds?: (ServiceOption | string)[];
  visitsPerPeriod: number;
  active: boolean;
  stripePriceId?: string;
  createdAt?: string;
}

export interface ClientRef {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface ClientSubscriptionItem {
  _id: string;
  clientId: ClientRef | null;
  planId: SubscriptionPlanItem | null;
  status: "active" | "past_due" | "cancelled" | "paused";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeSubscriptionId?: string;
  visitsUsedThisPeriod: number;
  createdAt?: string;
}

interface SubscriptionsManagerProps {
  initialPlans: SubscriptionPlanItem[];
  initialClientSubscriptions: ClientSubscriptionItem[];
  services: ServiceOption[];
  clients: ClientRef[];
}

export function SubscriptionsManager({
  initialPlans,
  initialClientSubscriptions,
  services,
  clients,
}: SubscriptionsManagerProps) {
  const [activeTab, setActiveTab] = useState<"plans" | "clientSubs">("plans");
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(initialPlans);
  const [clientSubs, setClientSubs] = useState<ClientSubscriptionItem[]>(initialClientSubscriptions);

  // Notifications
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Plan Modal state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    interval: "month" as "month" | "year",
    priceDollars: "",
    billingNote: "",
    visitsPerPeriod: 1,
    includedServiceIds: [] as string[],
    active: true,
    stripePriceId: "",
  });
  const [savingPlan, setSavingPlan] = useState(false);

  // Assign Client Subscription Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    clientId: "",
    planId: "",
    status: "active" as "active" | "past_due" | "cancelled" | "paused",
  });
  const [assigning, setAssigning] = useState(false);

  function showMsg(text: string, type: "success" | "error" = "success") {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  // --- PLANS LOGIC ---
  function handleOpenCreatePlan() {
    setEditingPlanId(null);
    setPlanForm({
      name: "",
      description: "",
      interval: "month",
      priceDollars: "",
      billingNote: "",
      visitsPerPeriod: 1,
      includedServiceIds: [],
      active: true,
      stripePriceId: "",
    });
    setIsPlanModalOpen(true);
  }

  function handleOpenEditPlan(plan: SubscriptionPlanItem) {
    setEditingPlanId(plan._id);
    setPlanForm({
      name: plan.name,
      description: plan.description || "",
      interval: plan.interval,
      priceDollars: (plan.priceCents / 100).toString(),
      billingNote: plan.billingNote || "",
      visitsPerPeriod: plan.visitsPerPeriod || 1,
      includedServiceIds: (plan.includedServiceIds || []).map((s) => (typeof s === "string" ? s : s._id)),
      active: plan.active,
      stripePriceId: plan.stripePriceId || "",
    });
    setIsPlanModalOpen(true);
  }

  async function handleSavePlan() {
    if (!planForm.name.trim()) {
      showMsg("Plan name is required", "error");
      return;
    }
    const priceCents = Math.round(parseFloat(planForm.priceDollars || "0") * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      showMsg("Please enter a valid price", "error");
      return;
    }

    setSavingPlan(true);
    try {
      const payload = {
        name: planForm.name.trim(),
        description: planForm.description.trim(),
        interval: planForm.interval,
        priceCents,
        billingNote: planForm.billingNote.trim(),
        visitsPerPeriod: Number(planForm.visitsPerPeriod),
        includedServiceIds: planForm.includedServiceIds,
        active: planForm.active,
      };

      const url = editingPlanId
        ? `/api/admin/subscription-plans/${editingPlanId}`
        : "/api/admin/subscription-plans";
      const method = editingPlanId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save plan");

      if (editingPlanId) {
        setPlans((prev) => prev.map((p) => (p._id === editingPlanId ? data.plan : p)));
        showMsg("Subscription plan updated!");
      } else {
        setPlans((prev) => [data.plan, ...prev]);
        showMsg("Subscription plan created!");
      }

      setIsPlanModalOpen(false);
    } catch (err: any) {
      showMsg(err.message || "Failed to save plan", "error");
    } finally {
      setSavingPlan(false);
    }
  }

  async function togglePlanActive(plan: SubscriptionPlanItem) {
    try {
      const res = await fetch(`/api/admin/subscription-plans/${plan._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !plan.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setPlans((prev) => prev.map((p) => (p._id === plan._id ? data.plan : p)));
      showMsg(`Plan "${plan.name}" is now ${data.plan.active ? "Active" : "Inactive"}.`);
    } catch (err: any) {
      showMsg(err.message || "Status toggle failed", "error");
    }
  }

  async function handleDeletePlan(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/subscription-plans/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete plan");

      setPlans((prev) => prev.filter((p) => p._id !== id));
      showMsg("Plan deleted successfully.");
    } catch (err: any) {
      showMsg(err.message || "Delete failed", "error");
    }
  }

  // --- CLIENT SUBSCRIPTIONS LOGIC ---
  async function handleAssignSubscription() {
    if (!assignForm.clientId || !assignForm.planId) {
      showMsg("Please select both a client and a subscription plan", "error");
      return;
    }

    setAssigning(true);
    try {
      const res = await fetch("/api/admin/client-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign subscription");

      setClientSubs((prev) => [data.subscription, ...prev]);
      showMsg("Membership assigned to client!");
      setIsAssignModalOpen(false);
    } catch (err: any) {
      showMsg(err.message || "Failed to assign membership", "error");
    } finally {
      setAssigning(false);
    }
  }

  async function updateClientSubStatus(subId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/client-subscriptions/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update membership status");

      setClientSubs((prev) => prev.map((s) => (s._id === subId ? data.subscription : s)));
      showMsg("Membership status updated!");
    } catch (err: any) {
      showMsg(err.message || "Update failed", "error");
    }
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold border ${
            msg.type === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#c8a86b]">
            Admin Membership Manager
          </span>
          <h1 className="display text-3xl sm:text-4xl text-[var(--ink)] mt-1">
            Subscriptions &amp; Client Memberships
          </h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Configure subscription packages, billing intervals, and manage client membership linkages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "plans" ? (
            <button
              type="button"
              onClick={handleOpenCreatePlan}
              className="btn-primary text-xs !py-2.5 !px-4 shadow-md"
            >
              + Create Subscription Plan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="btn-primary text-xs !py-2.5 !px-4 shadow-md"
            >
              + Assign Membership to Client
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "plans"
              ? "border-[#c8a86b] text-[#c8a86b]"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          🏷️ Subscription Plans ({plans.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("clientSubs")}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "clientSubs"
              ? "border-[#c8a86b] text-[#c8a86b]"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          👤 Active Client Memberships ({clientSubs.length})
        </button>
      </div>

      {/* TAB 1: SUBSCRIPTION PLANS */}
      {activeTab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.length === 0 ? (
            <div className="col-span-full text-center py-12 border border-dashed border-[var(--border-color)] rounded-2xl">
              <p className="text-sm text-[var(--ink-soft)]">No subscription plans configured yet.</p>
              <button
                type="button"
                onClick={handleOpenCreatePlan}
                className="mt-4 text-xs font-bold text-[#c8a86b] underline"
              >
                + Add First Membership Plan
              </button>
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan._id}
                className={`border rounded-2xl p-6 flex flex-col justify-between transition-all ${
                  plan.active
                    ? "bg-[var(--card-bg)] border-[var(--border-color)] shadow-sm"
                    : "bg-black/20 border-red-500/20 opacity-75"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#c8a86b] px-2 py-0.5 rounded-full bg-[#c8a86b]/10 border border-[#c8a86b]/20">
                        {plan.interval.toUpperCase()}LY PLAN
                      </span>
                      <h3 className="display text-2xl text-[var(--ink)] mt-2">{plan.name}</h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        plan.active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}
                    >
                      {plan.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="gold-text text-3xl font-bold">
                    {formatCad(plan.priceCents)}
                    <span className="text-xs font-normal text-[var(--ink-soft)]"> / {plan.interval}</span>
                  </p>

                  <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                    {plan.description || "No description specified."}
                  </p>

                  {plan.billingNote && (
                    <div className="p-2.5 rounded-lg bg-[#c8a86b]/10 border border-[#c8a86b]/20 text-[11px] text-[#c8a86b] font-medium">
                      💡 {plan.billingNote}
                    </div>
                  )}

                  <div className="pt-3 border-t border-[var(--border-color)] text-xs text-[var(--ink-soft)] space-y-2">
                    <p>
                      <strong>Visits Allowed:</strong> {plan.visitsPerPeriod} visit
                      {plan.visitsPerPeriod === 1 ? "" : "s"} / {plan.interval}
                    </p>
                    {plan.includedServiceIds && plan.includedServiceIds.length > 0 && (
                      <div>
                        <p className="font-bold text-[var(--ink)] mb-1.5 text-[11px]">Covered Services:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {plan.includedServiceIds.map((s) => {
                            const serviceId = typeof s === "object" && s !== null ? String(s._id) : String(s);
                            const matchedService = services.find((srv) => String(srv._id) === serviceId);
                            const name =
                              typeof s === "object" && s !== null && s.name
                                ? s.name
                                : matchedService?.name || "Service";
                            const price =
                              typeof s === "object" && s !== null && s.priceCents
                                ? s.priceCents
                                : matchedService?.priceCents;
                            return (
                              <span
                                key={serviceId}
                                className="bg-[#c8a86b]/15 border border-[#c8a86b]/30 text-[#c8a86b] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                              >
                                <span>✨</span>
                                <span>{name}</span>
                                {price ? <span className="opacity-75 font-normal">({formatCad(price)})</span> : null}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {plan.stripePriceId && (
                      <p className="truncate font-mono text-[10px] text-[var(--ink-faint)] pt-1">
                        Stripe ID: {plan.stripePriceId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => togglePlanActive(plan)}
                    className="text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold underline"
                  >
                    {plan.active ? "Deactivate" : "Activate"}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPlan(plan)}
                      className="text-[#c8a86b] font-bold hover:underline"
                    >
                      Edit ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan._id, plan.name)}
                      className="text-red-400 font-bold hover:underline"
                    >
                      Delete 🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: CLIENT SUBSCRIPTIONS */}
      {activeTab === "clientSubs" && (
        <div className="border border-[var(--border-color)] rounded-2xl overflow-hidden bg-[var(--card-bg)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black/30 border-b border-[var(--border-color)] text-[var(--ink-faint)] uppercase font-bold tracking-wider text-[10px]">
                  <th className="p-4">Client</th>
                  <th className="p-4">Membership Plan</th>
                  <th className="p-4">Current Period</th>
                  <th className="p-4">Visits Used</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 align-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {clientSubs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--ink-soft)]">
                      No client memberships assigned yet. Click &quot;+ Assign Membership to Client&quot; above.
                    </td>
                  </tr>
                ) : (
                  clientSubs.map((sub) => {
                    const clientObj = sub.clientId;
                    const planObj = sub.planId;

                    return (
                      <tr key={sub._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-semibold text-[var(--ink)]">
                          {clientObj?.name || "N/A"}
                          <span className="block text-[10px] font-normal text-[var(--ink-soft)]">
                            {clientObj?.email || "No email"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-[#c8a86b]">{planObj?.name || "Membership"}</span>
                          <span className="block text-[10px] text-[var(--ink-soft)]">
                            {planObj ? formatCad(planObj.priceCents) : "$0.00"} / {planObj?.interval || "month"}
                          </span>
                        </td>
                        <td className="p-4 text-[var(--ink-soft)]">
                          {format(new Date(sub.currentPeriodStart), "MMM d, yyyy")} →{" "}
                          {format(new Date(sub.currentPeriodEnd), "MMM d, yyyy")}
                        </td>
                        <td className="p-4 font-bold text-[var(--ink)]">
                          {sub.visitsUsedThisPeriod} / {planObj?.visitsPerPeriod || 1}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                              sub.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : sub.status === "paused"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={sub.status}
                            onChange={(e) => updateClientSubStatus(sub._id, e.target.value)}
                            className="bg-[var(--background)] border border-[var(--border-color)] text-[var(--ink)] text-[11px] rounded-lg px-2 py-1 font-medium cursor-pointer"
                          >
                            <option value="active">Set Active</option>
                            <option value="paused">Set Paused</option>
                            <option value="cancelled">Set Cancelled</option>
                            <option value="past_due">Set Past Due</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PLAN MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f1712] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <h3 className="display text-2xl text-[var(--ink)]">
              {editingPlanId ? "Edit Subscription Plan" : "Create Subscription Plan"}
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--ink-soft)] font-bold mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Lash Membership — Monthly"
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--ink)] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--ink-soft)] font-bold mb-1">Interval *</label>
                  <select
                    value={planForm.interval}
                    onChange={(e) => setPlanForm({ ...planForm, interval: e.target.value as "month" | "year" })}
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-[var(--ink)] font-medium"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--ink-soft)] font-bold mb-1">Price (CAD $) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={planForm.priceDollars}
                    onChange={(e) => setPlanForm({ ...planForm, priceDollars: e.target.value })}
                    placeholder="75.00"
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--ink)] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--ink-soft)] font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Monthly lash maintenance included..."
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--ink)] font-medium"
                />
              </div>

              <div>
                <label className="block text-[var(--ink-soft)] font-bold mb-1">Billing Note / Promo Tag</label>
                <input
                  type="text"
                  value={planForm.billingNote}
                  onChange={(e) => setPlanForm({ ...planForm, billingNote: e.target.value })}
                  placeholder="e.g. 12 for the price of 10 — two months free"
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--ink)] font-medium"
                />
              </div>

              {/* Link Services Section */}
              <div>
                <label className="block text-[var(--ink-soft)] font-bold mb-1.5">
                  Linked Services ({planForm.includedServiceIds.length} Selected) *
                </label>
                <div className="max-h-48 overflow-y-auto border border-[var(--border-color)] bg-[var(--background)] rounded-xl p-3 space-y-2">
                  {services.length === 0 ? (
                    <p className="text-xs text-[var(--ink-soft)] italic">No services available</p>
                  ) : (
                    services.map((s) => {
                      const isChecked = planForm.includedServiceIds.includes(s._id);
                      return (
                        <label
                          key={s._id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-[#c8a86b]/15 border-[#c8a86b] text-white font-bold"
                              : "bg-black/20 border-transparent text-[var(--ink-soft)] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setPlanForm((prev) => ({
                                  ...prev,
                                  includedServiceIds: isChecked
                                    ? prev.includedServiceIds.filter((id) => id !== s._id)
                                    : [...prev.includedServiceIds, s._id],
                                }));
                              }}
                              className="accent-[#c8a86b] rounded w-4 h-4 cursor-pointer"
                            />
                            <span>{s.name}</span>
                          </div>
                          <span className="gold-text font-semibold text-[11px]">
                            {formatCad(s.priceCents)}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--ink-soft)] font-bold mb-1">Visits Per Period</label>
                  <input
                    type="number"
                    min="1"
                    value={planForm.visitsPerPeriod}
                    onChange={(e) => setPlanForm({ ...planForm, visitsPerPeriod: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--ink)] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[var(--ink-soft)] font-bold mb-1">
                    Stripe Price ID <span className="text-[10px] text-[#c8a86b] font-normal">(Auto-Generated)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={planForm.stripePriceId || "Auto-synced on save 🔒"}
                    className="w-full bg-[var(--background)]/50 border border-[var(--border-color)] text-[var(--ink-soft)] rounded-xl px-4 py-2.5 font-mono text-[11px] cursor-not-allowed opacity-80"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[var(--ink-soft)] hover:text-[var(--ink)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingPlan}
                onClick={handleSavePlan}
                className="btn-primary text-xs !py-2.5 !px-5"
              >
                {savingPlan ? "Saving Plan..." : "Save Subscription Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN CLIENT SUBSCRIPTION MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f1712] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <h3 className="display text-2xl text-[var(--ink)]">Assign Membership to Client</h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--ink-soft)] font-bold mb-1">Select Client *</label>
                <select
                  value={assignForm.clientId}
                  onChange={(e) => setAssignForm({ ...assignForm, clientId: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-[var(--ink)] font-medium"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--ink-soft)] font-bold mb-1">Select Subscription Plan *</label>
                <select
                  value={assignForm.planId}
                  onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-[var(--ink)] font-medium"
                >
                  <option value="">-- Choose Membership Plan --</option>
                  {plans
                    .filter((p) => p.active)
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({formatCad(p.priceCents)} / {p.interval})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--ink-soft)] font-bold mb-1">Initial Status</label>
                <select
                  value={assignForm.status}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, status: e.target.value as any })
                  }
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-[var(--ink)] font-medium"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[var(--ink-soft)] hover:text-[var(--ink)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={assigning}
                onClick={handleAssignSubscription}
                className="btn-primary text-xs !py-2.5 !px-5"
              >
                {assigning ? "Assigning..." : "Assign Membership"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
