"use client";

import { useState } from "react";
import { format } from "date-fns";

export interface ReviewItem {
  _id: string;
  createdAt: string;
  submittedAt?: string;
  status: "pending" | "submitted" | "expired";
  rating: number;
  comment?: string;
  token: string;
  isVisibleOnLanding: boolean;
  guest?: {
    name: string;
    email: string;
    phone?: string;
  };
  serviceId?: {
    _id: string;
    name: string;
  };
  bookingId?: {
    _id: string;
    start?: string;
  };
}

interface ReviewsManagerProps {
  initialReviews: ReviewItem[];
}

export function ReviewsManager({ initialReviews }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [filter, setFilter] = useState<"all" | "landing" | "pending">("all");
  const [togglingId, setTogglingId] = useState<string>("");
  const [copiedToken, setCopiedToken] = useState<string>("");

  const filteredReviews = reviews.filter((r) => {
    if (filter === "landing") return r.isVisibleOnLanding;
    if (filter === "pending") return r.status === "pending";
    return true;
  });

  const submittedReviews = reviews.filter((r) => r.status === "submitted");
  const avgRating =
    submittedReviews.length > 0
      ? (submittedReviews.reduce((sum, r) => sum + r.rating, 0) / submittedReviews.length).toFixed(1)
      : "5.0";

  const landingCount = reviews.filter((r) => r.isVisibleOnLanding).length;

  async function handleToggleVisibility(id: string, currentVal: boolean) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}/toggle-visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisibleOnLanding: !currentVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update visibility");

      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, isVisibleOnLanding: data.isVisibleOnLanding } : r))
      );
    } catch (err: any) {
      alert(err.message || "Failed to toggle review visibility");
    } finally {
      setTogglingId("");
    }
  }

  function handleCopyLink(token: string) {
    const url = `${window.location.origin}/review?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(""), 2000);
  }

  return (
    <div className="w-full text-left space-y-8">
      {/* Title & Stat Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Client Reviews
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Manage client feedback, tokens, and landing page testimonial visibility.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)]">
            Average Rating
          </span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-extrabold text-[var(--ink)] font-mono">{avgRating}</span>
            <span className="text-lg text-[#c8a86b]">★★★★★</span>
          </div>
        </div>

        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)]">
            Submitted Reviews
          </span>
          <div className="text-3xl font-extrabold text-[var(--ink)] font-mono">
            {submittedReviews.length}
          </div>
        </div>

        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#c8a86b]">
            Featured on Landing
          </span>
          <div className="text-3xl font-extrabold text-[#c8a86b] font-mono">
            {landingCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[var(--border-color)] text-sm font-medium">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`pb-3 px-4 border-b-2 cursor-pointer transition-all duration-200 ${
            filter === "all"
              ? "border-[#c8a86b] text-[#c8a86b] font-semibold"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          All Reviews ({reviews.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("landing")}
          className={`pb-3 px-4 border-b-2 cursor-pointer transition-all duration-200 ${
            filter === "landing"
              ? "border-[#c8a86b] text-[#c8a86b] font-semibold"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          Featured on Landing ({landingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`pb-3 px-4 border-b-2 cursor-pointer transition-all duration-200 ${
            filter === "pending"
              ? "border-[#c8a86b] text-[#c8a86b] font-semibold"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          Pending Invitations ({reviews.filter((r) => r.status === "pending").length})
        </button>
      </div>

      {/* Data Table */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm text-[var(--ink)]">
          <thead className="text-[var(--ink-soft)]/75 border-b border-[var(--border-color)]">
            <tr>
              <th className="py-2.5 pr-4 font-bold text-xs uppercase">Date</th>
              <th className="py-2.5 pr-4 font-bold text-xs uppercase">Client / Sender</th>
              <th className="py-2.5 pr-4 font-bold text-xs uppercase">Service</th>
              <th className="py-2.5 pr-4 font-bold text-xs uppercase">Rating</th>
              <th className="py-2.5 pr-4 font-bold text-xs uppercase">Review Comment</th>
              <th className="py-2.5 pr-4 font-bold text-xs uppercase">Landing Visible</th>
              <th className="py-2.5 pr-4 font-bold text-xs uppercase">Status</th>
              <th className="py-2.5 text-right font-bold text-xs uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map((r) => (
              <tr key={r._id} className="border-b border-[var(--border-color)]/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pr-4 text-xs font-mono text-[var(--ink-soft)]">
                  {format(new Date(r.submittedAt || r.createdAt), "PP p")}
                </td>
                <td className="py-3 pr-4 font-semibold text-xs text-[var(--ink)]">
                  {r.guest?.name || "Valued Client"}
                  {r.guest?.email && (
                    <span className="block text-[11px] font-mono text-[var(--ink-soft)] font-normal">
                      {r.guest.email}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-xs font-medium text-[var(--ink)]">
                  {r.serviceId?.name || "Esthetics Treatment"}
                </td>
                <td className="py-3 pr-4 font-bold text-xs text-[#c8a86b]">
                  {r.status === "submitted" ? (
                    <span>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  ) : (
                    <span className="text-[var(--ink-soft)]">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-xs max-w-[220px] truncate text-[var(--ink)] italic">
                  {r.comment ? `"${r.comment}"` : <span className="text-[var(--ink-soft)] font-normal">No comment yet</span>}
                </td>
                <td className="py-3 pr-4 text-xs">
                  <button
                    type="button"
                    disabled={togglingId === r._id || r.status !== "submitted"}
                    onClick={() => handleToggleVisibility(r._id, r.isVisibleOnLanding)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-30 ${
                      r.isVisibleOnLanding ? "bg-[#c8a86b]" : "bg-black/20 dark:bg-white/20"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        r.isVisibleOnLanding ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
                <td className="py-3 pr-4 text-xs font-bold">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold border ${
                      r.status === "submitted"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                        : "border-[#c8a86b]/40 bg-[#c8a86b]/10 text-[#c8a86b]"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="py-3 text-right text-xs">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(r.token)}
                    className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-[11px] font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[#c8a86b] transition-all cursor-pointer"
                  >
                    {copiedToken === r.token ? "✓ Copied Link" : "📋 Copy Link"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredReviews.length === 0 && (
          <p className="py-8 text-center text-xs text-[var(--ink-soft)] italic">
            No reviews found for this view.
          </p>
        )}
      </div>
    </div>
  );
}
