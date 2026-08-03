"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export type ClientRow = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  banned: boolean;
  photoUrl?: string;
  referralCode?: string;
  stripeCustomerId?: string;
  subscription?: any;
};

interface ClientEditorProps {
  initialClient?: ClientRow;
  isEdit?: boolean;
  services?: { id: string; name: string }[];
}

export function ClientEditor({
  initialClient,
  isEdit = false,
  services = [],
}: ClientEditorProps) {
  const router = useRouter();

  const [form, setForm] = useState<Omit<ClientRow, "id">>({
    name: "",
    email: "",
    phone: "",
    active: true,
    banned: false,
    photoUrl: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Tab views state
  const [activeTab, setActiveTab] = useState<string>("bookings");
  const [details, setDetails] = useState<{
    bookings: any[];
    payments: any[];
    sessionImages: any[];
    creditCards: any[];
    subscriptions: any[];
  } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload states
  const [profileUploading, setProfileUploading] = useState(false);
  const [sessionUploading, setSessionUploading] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    serviceId: services[0]?.id || "",
    type: "pre" as "pre" | "post",
    isPrivate: false,
  });

  // Initialize form state when editing
  useEffect(() => {
    if (isEdit && initialClient) {
      setForm({
        name: initialClient.name,
        email: initialClient.email,
        phone: initialClient.phone || "",
        active: initialClient.active !== false,
        banned: Boolean(initialClient.banned),
        photoUrl: initialClient.photoUrl || "",
      });
    }
  }, [isEdit, initialClient]);

  // Fetch client logs / histories
  const fetchDetails = useCallback(async () => {
    if (!isEdit || !initialClient?.id) return;
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/clients/details?id=${initialClient.id}`);
      if (!res.ok) throw new Error("Failed to load details");
      const data = await res.json();
      setDetails(data);
    } catch (err) {
      console.error("[ClientDetails Fetch Error]:", err);
    } finally {
      setDetailsLoading(false);
    }
  }, [isEdit, initialClient]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  // Auto-select first service if updated
  useEffect(() => {
    if (services.length > 0 && !sessionForm.serviceId) {
      setSessionForm((prev) => ({ ...prev, serviceId: services[0].id }));
    }
  }, [services, sessionForm.serviceId]);

  async function handleProfilePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "profile");

      const res = await fetch("/api/services/images", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload photo");

      setForm((prev) => ({
        ...prev,
        photoUrl: data.url,
      }));
    } catch (err: any) {
      setError(err.message || "Failed to upload profile photo.");
    } finally {
      setProfileUploading(false);
      e.target.value = "";
    }
  }

  async function handleSessionImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!sessionForm.serviceId) {
      setError("Please select a service type before uploading a session image.");
      return;
    }

    setSessionUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("serviceId", sessionForm.serviceId);
      formData.append("clientId", initialClient?.id || "");
      formData.append("type", sessionForm.type);
      formData.append("isPrivate", String(sessionForm.isPrivate));

      const res = await fetch("/api/services/images", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload session image");

      if (details) {
        setDetails({
          ...details,
          sessionImages: [data.serviceImage, ...details.sessionImages],
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload session image.");
    } finally {
      setSessionUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteSessionImage(id: string) {
    if (!window.confirm("Are you sure you want to delete this session image permanently from Pinata IPFS?")) {
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/services/images?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete image");

      if (details) {
        setDetails({
          ...details,
          sessionImages: details.sessionImages.filter((img) => img._id !== id && img.id !== id),
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete session image.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setLoading(true);
    setError("");

    if (!form.name.trim()) {
      setError("Client name is required.");
      setLoading(false);
      return;
    }

    if (!form.email.trim()) {
      setError("Client email is required.");
      setLoading(false);
      return;
    }

    try {
      const payload = isEdit
        ? { id: initialClient?.id, ...form }
        : form;

      const res = await fetch("/api/clients", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save client profile.");

      router.push("/admin/clients");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save client.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full text-left space-y-6">
      {/* 1. Account Details Form */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-[family-name:var(--font-display)] text-[var(--ink)]">
            {isEdit ? "Modify Client Profile" : "Register Client Account"}
          </h2>
          <Link
            href="/admin/clients"
            className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 transition-colors"
          >
            ← Back to Clients
          </Link>
        </div>

        {/* Dynamic Avatar Profile Header */}
        {isEdit && (
          <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-[var(--border-color)] pb-6 mb-6">
            <div className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-[#c8a86b] bg-gradient-to-tr from-[#2f5d4a] to-[#c8a86b] flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{form.name ? form.name.slice(0, 2).toUpperCase() : "U"}</span>
              )}
              
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-bold cursor-pointer transition-opacity duration-200">
                <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Change</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={profileUploading}
                  onChange={(e) => void handleProfilePhotoUpload(e)}
                />
              </label>
            </div>
            <div className="text-center sm:text-left min-w-0">
              <h3 className="text-lg font-bold text-[var(--ink)] leading-snug">{form.name || "Client Account"}</h3>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">{form.email || "Enter account email"}</p>
              {profileUploading && <span className="text-[10px] text-[#c8a86b] font-medium animate-pulse mt-1.5 block">Uploading profile photo to IPFS...</span>}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
              Client Name
            </label>
            <input
              placeholder="e.g. Jane Doe"
              type="text"
              style={{ backgroundColor: "var(--card-bg)" }}
              className="w-full border border-[var(--border-color)] px-3 py-2.5 text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              placeholder="e.g. jane.doe@example.com"
              type="email"
              disabled={isEdit}
              style={{ backgroundColor: "var(--card-bg)" }}
              className="w-full border border-[var(--border-color)] px-3 py-2.5 text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              placeholder="e.g. 780-123-4567"
              type="text"
              style={{ backgroundColor: "var(--card-bg)" }}
              className="w-full border border-[var(--border-color)] px-3 py-2.5 text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          {/* Active Status Checkbox */}
          <div className="flex items-end pb-3.5 pl-1">
            <label className="flex items-center gap-2.5 text-sm text-[var(--ink-soft)] font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.active}
                className="w-5 h-5 rounded border-[var(--border-color)] text-[#2f5d4a] focus:ring-[#2f5d4a]"
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active Client (Can request appointments)
            </label>
          </div>

          {/* Banned Status Checkbox */}
          <div className="sm:col-span-2 border-t border-[var(--border-color)] pt-4 mt-2">
            <div className="flex items-start pl-1 gap-3 p-3 bg-red-500/5 border border-red-900/30 rounded-xl">
              <input
                type="checkbox"
                id="banned"
                checked={form.banned}
                className="w-5 h-5 mt-0.5 rounded border-red-900/50 text-red-500 focus:ring-red-500 cursor-pointer"
                onChange={(e) => setForm({ ...form, banned: e.target.checked })}
              />
              <label htmlFor="banned" className="flex-1 text-xs text-[var(--ink-soft)] cursor-pointer select-none">
                <span className="block font-bold text-red-400 uppercase tracking-wider mb-0.5">Ban Client Account</span>
                Restrict this client from making booking requests, sending payments, or utilizing referrals permanently.
              </label>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex gap-2 border-t border-[var(--border-color)] pt-5">
          <button
            type="button"
            disabled={loading || !form.name || !form.email}
            className="bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:from-[#e2c78c] hover:to-[#c8a86b] text-[#24180a] hover:shadow-[0_0_15px_rgba(200,168,107,0.25)] font-semibold text-sm py-2.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
            onClick={() => void save()}
          >
            {isEdit ? "Update Client Profile" : "Register Client"}
          </button>
          <Link
            href="/admin/clients"
            className="border border-[var(--border-color)] hover:border-red-500 hover:text-red-500 hover:bg-red-500/5 text-xs text-[var(--ink-soft)] transition-all duration-200 cursor-pointer rounded-xl px-4 py-2.5 font-medium flex items-center justify-center"
          >
            Cancel
          </Link>
        </div>

        {error && <p className="mt-3 text-sm text-red-400 font-semibold">{error}</p>}
      </div>

      {/* 2. client Histories & logs Dashboard (Only if isEdit) */}
      {isEdit && (
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl overflow-hidden shadow-sm transition-colors duration-200">
          
          {/* Tabs Selector Navigation Header */}
          <div className="flex border-b border-[var(--border-color)] bg-black/5 dark:bg-black/20 overflow-x-auto scrollbar-none">
            {[
              { id: "bookings", label: "Bookings" },
              { id: "payments", label: "Payments" },
              { id: "images", label: "Session Images" },
              { id: "billing", label: "Billing Information" },
              { id: "subscription", label: "Subscription" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#c8a86b] text-[#c8a86b]"
                    : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Details Content panels */}
          <div className="p-6">
            {detailsLoading ? (
              <p className="text-xs text-[var(--ink-soft)] italic animate-pulse py-12 text-center">
                Syncing database information log...
              </p>
            ) : (
              <div>
                
                {/* A. BOOKINGS LOG TAB */}
                {activeTab === "bookings" && (
                  <div className="space-y-4">
                    {details?.bookings && details.bookings.length > 0 ? (
                      <div className="grid gap-3">
                        {details.bookings.map((b) => (
                          <div
                            key={b._id}
                            className="border border-[var(--border-color)] bg-black/5 dark:bg-black/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between gap-3 text-left"
                          >
                            <div>
                              <p className="text-sm font-bold text-[var(--ink)]">
                                {b.serviceId?.name || "Unregistered Service"}
                              </p>
                              <p className="text-xs text-[var(--ink-soft)] mt-1 font-medium">
                                Date: {new Date(b.start).toLocaleDateString("en-CA", { dateStyle: "long" })}
                              </p>
                              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                                Time Slot: {new Date(b.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              {b.notes && (
                                <p className="text-[11px] text-[var(--ink-soft)]/85 bg-black/10 dark:bg-white/5 border border-[var(--border-color)]/30 rounded-lg p-2 mt-2">
                                  Notes: {b.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-start sm:items-end justify-between shrink-0">
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                b.status === "confirmed" || b.status === "completed"
                                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                                  : b.status === "cancelled"
                                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                              }`}>
                                {b.status}
                              </span>
                              
                              <p className="text-xs font-bold text-[var(--ink)] mt-2">
                                Total: CAD ${(b.paymentSummary?.totalCents / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--ink-soft)] italic text-center py-6">
                        No appointment booking entries logged yet.
                      </p>
                    )}
                  </div>
                )}

                {/* B. PAYMENTS HISTORY TAB */}
                {activeTab === "payments" && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-[var(--ink-soft)] font-medium flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-2.5 rounded-xl border border-[var(--border-color)]">
                      <span>🔍</span>
                      <span>Click any payment row below to inspect full Stripe identifiers, payment method details, and linked booking info.</span>
                    </p>

                    {details?.payments && details.payments.length > 0 ? (
                      <div className="overflow-x-auto border border-[var(--border-color)] rounded-xl">
                        <table className="w-full border-collapse text-xs text-[var(--ink)]">
                          <thead>
                            <tr className="bg-black/10 dark:bg-white/5 border-b border-[var(--border-color)] text-[var(--ink-soft)] text-left font-bold uppercase tracking-wider">
                              <th className="p-3">Amount</th>
                              <th className="p-3">Method</th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Created</th>
                              <th className="p-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.payments.map((p) => (
                              <tr
                                key={p._id}
                                onClick={() => setSelectedPayment(p)}
                                className="border-b border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
                              >
                                <td className="p-3 font-semibold text-[#c8a86b]">CAD ${(p.amountCents / 100).toFixed(2)}</td>
                                <td className="p-3 capitalize">{p.method}</td>
                                <td className="p-3 capitalize">{p.kind}</td>
                                <td className="p-3 font-mono">
                                  {new Date(p.createdAt).toLocaleDateString("en-CA")}
                                </td>
                                <td className="p-3 text-right">
                                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                    p.status === "succeeded"
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                      : p.status === "failed"
                                      ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                                      : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--ink-soft)] italic text-center py-6">
                        No billing payments logged yet.
                      </p>
                    )}
                  </div>
                )}

                {/* C. SESSION IMAGES (TREATMENT PORTFOLIO LOG) TAB */}
                {activeTab === "images" && (
                  <div className="space-y-6">
                    {/* Add Image segment */}
                    {services.length > 0 && (
                      <div className="border border-[var(--border-color)] bg-black/5 dark:bg-black/10 p-4 rounded-xl space-y-4">
                        <h4 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                          Upload Pre/Post Result Treatment Image
                        </h4>
                        
                        <div className="grid gap-4 sm:grid-cols-3 items-end">
                          <div>
                            <span className="block text-[10px] text-[var(--ink-soft)] font-semibold uppercase tracking-wider mb-1">
                              Treatment Service Type
                            </span>
                            <select
                              style={{ backgroundColor: "var(--card-bg)" }}
                              className="w-full border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-lg transition-colors cursor-pointer"
                              value={sessionForm.serviceId}
                              onChange={(e) => setSessionForm({ ...sessionForm, serviceId: e.target.value })}
                            >
                              {services.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <span className="block text-[10px] text-[var(--ink-soft)] font-semibold uppercase tracking-wider mb-1">
                              Stage
                            </span>
                            <select
                              style={{ backgroundColor: "var(--card-bg)" }}
                              className="w-full border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-lg transition-colors cursor-pointer"
                              value={sessionForm.type}
                              onChange={(e) => setSessionForm({ ...sessionForm, type: e.target.value as "pre" | "post" })}
                            >
                              <option value="pre">Pre-Treatment</option>
                              <option value="post">Post-Treatment</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 mb-2 pb-1">
                            <input
                              type="checkbox"
                              id="isPrivate"
                              checked={sessionForm.isPrivate}
                              className="w-4 h-4 rounded border-[var(--border-color)] text-[#2f5d4a] focus:ring-[#2f5d4a]"
                              onChange={(e) => setSessionForm({ ...sessionForm, isPrivate: e.target.checked })}
                            />
                            <label htmlFor="isPrivate" className="text-xs text-[var(--ink-soft)] font-medium cursor-pointer">
                              Mark as Private Record
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="inline-flex items-center gap-2 bg-[#2f5d4a] hover:bg-[#3b725b] text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-200">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Select & Upload Result Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={sessionUploading}
                              onChange={(e) => void handleSessionImageUpload(e)}
                            />
                          </label>
                          {sessionUploading && (
                            <span className="text-xs text-[#c8a86b] font-medium animate-pulse ml-3">
                              Uploading treatment file to Pinata IPFS...
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Image listing */}
                    {details?.sessionImages && details.sessionImages.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mt-4">
                        {details.sessionImages.map((img) => (
                          <div
                            key={img._id || img.id}
                            className="flex gap-3 p-3 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl items-center relative group text-left"
                          >
                            <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-[var(--border-color)]">
                              <img src={img.url} alt="Result Log" className="w-full h-full object-cover" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[var(--ink)] truncate">
                                {img.serviceId?.name || "Service Item"}
                              </p>
                              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1.5 ${
                                img.type === "pre"
                                  ? "border-amber-500/30 bg-amber-500/5 text-amber-500"
                                  : "border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                              }`}>
                                {img.type === "pre" ? "Pre-Treatment" : "Post-Treatment"}
                              </span>
                              <div className="text-[10px] text-[var(--ink-soft)] mt-1 font-semibold flex items-center gap-1">
                                {img.isPrivate ? (
                                  <span className="text-red-400 font-bold">🔒 Private Record</span>
                                ) : (
                                  <span className="text-green-500 font-bold">🌐 Public Gallery</span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => void handleDeleteSessionImage(img._id || img.id)}
                              className="text-xs text-red-400 hover:text-red-500 font-semibold p-1 hover:bg-red-500/5 rounded cursor-pointer transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--ink-soft)] italic text-center py-6">
                        No session treatment logs uploaded yet.
                      </p>
                    )}
                  </div>
                )}

                {/* D. BILLING INFORMATION TAB */}
                {activeTab === "billing" && (
                  <div className="space-y-4">
                    {details?.creditCards && details.creditCards.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {details.creditCards.map((card) => (
                          <div
                            key={card._id}
                            className="border border-[var(--border-color)] bg-black/5 dark:bg-black/10 p-4 rounded-xl flex items-center justify-between gap-3 text-left"
                          >
                            <div>
                              <p className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                                <span className="uppercase">{card.brand}</span>
                                <span>•••• {card.last4}</span>
                              </p>
                              <p className="text-xs text-[var(--ink-soft)] mt-1 font-medium">
                                Expiry: {card.expMonth}/{card.expYear}
                              </p>
                            </div>
                            
                            {card.isDefault && (
                              <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400">
                                Default
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--ink-soft)] italic text-center py-6">
                        No credit card profiles stored. Stored cards are managed dynamically via Stripe Customer billing links.
                      </p>
                    )}
                  </div>
                )}

                {/* E. SUBSCRIPTION TAB */}
                {activeTab === "subscription" && (
                  <div className="space-y-4">
                    {details?.subscriptions && details.subscriptions.length > 0 ? (
                      <div className="grid gap-3">
                        {details.subscriptions.map((sub) => (
                          <div
                            key={sub._id}
                            className="border border-[var(--border-color)] bg-black/5 dark:bg-black/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between gap-3 text-left"
                          >
                            <div>
                              <p className="text-sm font-bold text-[var(--ink)]">
                                {sub.planId?.name || "Membership Plan"}
                              </p>
                              <p className="text-xs text-[var(--ink-soft)] mt-1 font-medium">
                                Period End: {new Date(sub.currentPeriodEnd).toLocaleDateString("en-CA", { dateStyle: "long" })}
                              </p>
                              <p className="text-[11px] text-[var(--ink-soft)] mt-0.5">
                                Stripe Ref ID: {sub.stripeSubscriptionId || "—"}
                              </p>
                            </div>
                            <div className="flex flex-col items-start sm:items-end justify-between shrink-0">
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                sub.status === "active"
                                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                              }`}>
                                {sub.status}
                              </span>
                              
                              <p className="text-xs font-bold text-[#c8a86b] mt-2">
                                Visits used: {sub.visitsUsedThisPeriod} this period
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--ink-soft)] italic text-center py-6">
                        No membership subscriptions registered.
                      </p>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}
      {/* Slide-Over Side Drawer for Selected Payment Details */}
      {selectedPayment && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedPayment(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[560px] bg-[var(--card-bg)] text-[var(--ink)] shadow-2xl z-50 border-l border-[var(--border-color)] flex flex-col h-full overflow-hidden transition-transform animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-black/5 dark:bg-black/30 shrink-0">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-[family-name:var(--font-display)] text-[var(--ink)]">
                    Payment Transaction
                  </h3>
                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    selectedPayment.status === "succeeded"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      : selectedPayment.status === "failed"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-500"
                  }`}>
                    {selectedPayment.status}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-soft)] mt-1 font-mono">
                  ID: {selectedPayment._id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] rounded-xl w-8 h-8 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Amount & Method Header Card */}
              <div className="border border-[var(--border-color)] bg-black/5 dark:bg-black/20 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                    Total Payment Amount
                  </span>
                  <span className="text-2xl font-[family-name:var(--font-display)] text-[#c8a86b] font-bold">
                    CAD ${(selectedPayment.amountCents / 100).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-color)] text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--ink-soft)] uppercase font-bold tracking-wider block">
                      Payment Method
                    </span>
                    <span className="font-semibold capitalize text-[var(--ink)] block mt-0.5">
                      {selectedPayment.method === "stripe" ? "💳 Stripe Credit Card" : selectedPayment.method === "etransfer" ? "🏦 Interac e-Transfer" : "💵 Cash / Studio"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--ink-soft)] uppercase font-bold tracking-wider block">
                      Payment Purpose
                    </span>
                    <span className="font-semibold capitalize text-[var(--ink)] block mt-0.5">
                      {selectedPayment.kind || "Deposit"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--ink-soft)] uppercase font-bold tracking-wider block">
                      Date &amp; Time
                    </span>
                    <span className="font-mono text-[var(--ink-soft)] text-[11px] block mt-0.5">
                      {new Date(selectedPayment.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stripe Details */}
              <div className="border border-[var(--border-color)] bg-black/5 dark:bg-black/20 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                  💳 Stripe Identifiers &amp; Proof
                </h4>

                {selectedPayment.stripePaymentIntentId ? (
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-soft)] tracking-wider block">
                      Stripe Payment Intent ID
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-[#c8a86b] font-mono break-all">
                        {selectedPayment.stripePaymentIntentId}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedPayment.stripePaymentIntentId);
                          setCopiedId("intent");
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-[#c8a86b]/15 text-[#c8a86b] font-bold hover:bg-[#c8a86b]/25 transition-colors shrink-0"
                      >
                        {copiedId === "intent" ? "✓ Copied" : "Copy ID"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {selectedPayment.stripeCheckoutSessionId ? (
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-soft)] tracking-wider block">
                      Stripe Checkout Session ID
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-[#c8a86b] font-mono break-all">
                        {selectedPayment.stripeCheckoutSessionId}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedPayment.stripeCheckoutSessionId);
                          setCopiedId("session");
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-[#c8a86b]/15 text-[#c8a86b] font-bold hover:bg-[#c8a86b]/25 transition-colors shrink-0"
                      >
                        {copiedId === "session" ? "✓ Copied" : "Copy ID"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {!selectedPayment.stripePaymentIntentId && !selectedPayment.stripeCheckoutSessionId && (
                  <p className="text-xs text-[var(--ink-soft)] italic">
                    Manual transaction (e-Transfer or Cash). No Stripe Intent ID associated.
                  </p>
                )}

                {selectedPayment.proofUrl && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-[var(--ink-soft)] tracking-wider block mb-1">
                      e-Transfer Proof Document
                    </span>
                    <a
                      href={selectedPayment.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#c8a86b] hover:underline font-mono truncate block"
                    >
                      View Proof Image ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Linked Booking Information */}
              {selectedPayment.bookingId ? (
                <div className="border border-[var(--border-color)] bg-black/5 dark:bg-black/20 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <h4 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                      📅 Linked Appointment Booking
                    </h4>
                    <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      {selectedPayment.bookingId.status || "CONFIRMED"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-soft)]">Service Treatment:</span>
                      <span className="font-semibold text-[var(--ink)]">
                        {selectedPayment.bookingId.serviceId?.name || "Esthetics Treatment"}
                      </span>
                    </div>

                    {selectedPayment.bookingId.serviceId?.durationMin && (
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">Duration:</span>
                        <span className="text-[var(--ink)]">
                          {selectedPayment.bookingId.serviceId.durationMin} minutes
                        </span>
                      </div>
                    )}

                    {selectedPayment.bookingId.start && (
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">Scheduled Time:</span>
                        <span className="font-mono text-[#c8a86b]">
                          {new Date(selectedPayment.bookingId.start).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Financial Summary */}
                  {selectedPayment.bookingId.paymentSummary && (
                    <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] space-y-1.5 pt-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">Service Total:</span>
                        <span className="font-bold text-[var(--ink)]">
                          ${(selectedPayment.bookingId.paymentSummary.totalCents / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-500 font-medium">
                        <span>Deposit Paid:</span>
                        <span>
                          -${(selectedPayment.bookingId.paymentSummary.paidCents / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-[var(--border-color)] font-bold text-[var(--ink)]">
                        <span>Balance Due:</span>
                        <span>
                          ${(selectedPayment.bookingId.paymentSummary.balanceDueCents / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link
                      href="/admin/bookings"
                      className="btn-primary text-xs w-full py-2.5 shadow-md text-center block"
                    >
                      📅 Open Booking in Calendar
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-[var(--border-color)] p-4 rounded-2xl text-center text-xs text-[var(--ink-soft)]">
                  No linked booking record found for this transaction.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
