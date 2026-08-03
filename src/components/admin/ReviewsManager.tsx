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
  const [message, setMessage] = useState("");

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

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
      showMsg(
        data.isVisibleOnLanding
          ? "Review is now featured on the public website landing page!"
          : "Review hidden from website landing page."
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
    showMsg("Review invitation link copied to clipboard!");
    setTimeout(() => setCopiedToken(""), 2500);
  }

  return (
    <div className="space-y-6 text-[var(--ink)]">
      {/* Top Banner Header matching Categories, Quizzes & Promotions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">
            ⭐ Client Reviews &amp; Testimonials
          </h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Manage client feedback, invitation tokens, and control featured testimonials displayed on the public landing page.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
          ✓ {message}
        </div>
      )}

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

      {/* Standardized Filter Tabs */}
      <div className="flex border-b border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            filter === "all"
              ? "border-[#c8a86b] text-[#c8a86b]"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          All Reviews ({reviews.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("landing")}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            filter === "landing"
              ? "border-[#c8a86b] text-[#c8a86b]"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          Featured on Landing ({landingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            filter === "pending"
              ? "border-[#c8a86b] text-[#c8a86b]"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          Pending Invitations ({reviews.filter((r) => r.status === "pending").length})
        </button>
      </div>

      {/* Standardized Data Table */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--ink-soft)] uppercase font-bold tracking-wider text-[10px]">
                <th className="p-4">Date</th>
                <th className="p-4">Client / Sender</th>
                <th className="p-4">Service</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Review Comment</th>
                <th className="p-4">Landing Visible</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[var(--ink-soft)] italic">
                    No reviews found for this filter view.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => (
                  <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-[var(--ink-soft)] font-mono text-[11px]">
                      {format(new Date(r.submittedAt || r.createdAt), "PP p")}
                    </td>
                    <td className="p-4 font-bold text-sm text-[var(--ink)]">
                      <div>{r.guest?.name || "Valued Client"}</div>
                      {r.guest?.email && (
                        <div className="text-[11px] font-mono text-[var(--ink-soft)] font-normal mt-0.5">
                          {r.guest.email}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-[var(--ink)]">
                      {r.serviceId?.name || "Esthetics Treatment"}
                    </td>
                    <td className="p-4 font-bold text-sm text-[#c8a86b]">
                      {r.status === "submitted" ? (
                        <span>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                      ) : (
                        <span className="text-[var(--ink-soft)]">—</span>
                      )}
                    </td>
                    <td className="p-4 max-w-xs truncate text-[var(--ink)] italic">
                      {r.comment ? `"${r.comment}"` : <span className="text-[var(--ink-soft)] font-normal">No comment yet</span>}
                    </td>
                    <td className="p-4">
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
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          r.status === "submitted"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-[#c8a86b]/40 bg-[#c8a86b]/10 text-[#c8a86b]"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(r.token)}
                        className="px-3 py-1.5 border border-[var(--border-color)] text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[#c8a86b] rounded-xl transition-all cursor-pointer"
                      >
                        {copiedToken === r.token ? "✓ Copied Link" : "📋 Copy Link"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
