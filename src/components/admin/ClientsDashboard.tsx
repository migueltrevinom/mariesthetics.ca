"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";

type ClientRow = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  banned: boolean;
  referralCode?: string;
  subscription?: any;
  createdAt?: string;
  lastBookingDate?: string | null;
  totalBookings?: number;
};

const FILTERS = [
  { value: "all", label: "All Clients" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "withSubscription", label: "Subscribed" },
  { value: "banned", label: "Banned" },
];

export function ClientsDashboard() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "20",
        search,
        filter,
      });
      const res = await fetch(`/api/clients?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load client directory.");
      const data = await res.json();
      setClients(data.clients || []);
      setTotalPages(data.totalPages || 1);
      setTotalClients(data.total || 0);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching clients.");
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      void fetchClients();
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchClients]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleFilterChange = (val: string) => {
    setFilter(val);
    setPage(1);
  };

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this client profile permanently? This action cannot be undone.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/clients?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete client");
      
      void fetchClients();
    } catch (err: any) {
      alert(err.message || "Failed to delete client.");
      setLoading(false);
    }
  }

  async function toggleBan(client: ClientRow) {
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: client._id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          active: client.active !== false,
          banned: !client.banned,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update ban status");
      
      void fetchClients();
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Client Directory
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)] max-w-xl">
            Complete database of client accounts, registration dates, and appointment history. Select any client to view or manage payment links.
          </p>
        </div>
        
        <Link
          href="/admin/clients/new"
          className="self-start sm:self-center bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:from-[#e2c78c] hover:to-[#c8a86b] hover:shadow-[0_0_15px_rgba(200,168,107,0.25)] text-[#24180a] font-semibold text-sm py-2.5 px-6 rounded-xl transition-all duration-300 cursor-pointer shadow-md text-center block"
        >
          + Add Client
        </Link>
      </div>

      {/* Search and Filters Segment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl shadow-sm">
        {/* Search box */}
        <div className="relative flex-1 max-w-md w-full">
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            style={{ backgroundColor: "var(--card-bg)" }}
            className="w-full border border-[var(--border-color)] px-4 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus-visible:outline-none focus:border-[#c8a86b] focus:ring-1 focus:ring-[#c8a86b] placeholder-[var(--ink-soft)]/50"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3.5 top-3 text-[var(--ink-soft)] hover:text-[var(--ink)] text-xs cursor-pointer font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleFilterChange(f.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer text-center whitespace-nowrap ${
                filter === f.value
                  ? "bg-[#2f5d4a] text-white border-transparent shadow-sm"
                  : "border-[var(--border-color)] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-white/[0.02]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Luxury High-Density Data Table */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-3xl shadow-sm overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-black/5 dark:bg-black/20 text-[10px] uppercase font-bold text-[var(--ink-soft)] tracking-wider">
                <th className="py-4 px-6">Client Profile</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Joined Date</th>
                <th className="py-4 px-4">Last Booking Date</th>
                <th className="py-4 px-4">Total Bookings</th>
                <th className="py-4 px-4">Referral</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--ink)] font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--ink-soft)] animate-pulse">
                    Loading clients directory...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--ink-soft)] italic">
                    No client profiles found matching your search criteria.
                  </td>
                </tr>
              ) : (
                clients.map((c) => {
                  const initials = c.name
                    ? c.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : "CL";

                  const joinedFormatted = c.createdAt
                    ? format(new Date(c.createdAt), "MMM d, yyyy")
                    : "—";

                  const lastBookingFormatted = c.lastBookingDate
                    ? format(new Date(c.lastBookingDate), "MMM d, yyyy h:mm a")
                    : "No bookings yet";

                  return (
                    <tr
                      key={c._id}
                      className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                        c.banned ? "bg-red-950/10 opacity-75" : ""
                      }`}
                    >
                      {/* Client Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c8a86b]/30 to-[#2f5d4a]/30 text-[#c8a86b] font-bold text-xs flex items-center justify-center border border-[#c8a86b]/30 shrink-0">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-sm text-[var(--ink)] block truncate">
                              {c.name}
                            </span>
                            <span className="text-xs text-[var(--ink-soft)] font-mono block truncate mt-0.5">
                              {c.email} {c.phone ? `· ${c.phone}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {c.banned ? (
                            <span className="inline-block text-[9px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-500">
                              Banned
                            </span>
                          ) : c.active !== false ? (
                            <span className="inline-block text-[9px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              Active
                            </span>
                          ) : (
                            <span className="inline-block text-[9px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500">
                              Inactive
                            </span>
                          )}

                          {c.subscription && (
                            <span className="inline-block text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border border-[#c8a86b]/40 bg-[#c8a86b]/10 text-[#c8a86b]">
                              Subscribed
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-[var(--ink-soft)] font-mono text-[11px]">
                        {joinedFormatted}
                      </td>

                      {/* Last Booking Date */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px]">
                        {c.lastBookingDate ? (
                          <span className="text-[var(--ink)] font-semibold">{lastBookingFormatted}</span>
                        ) : (
                          <span className="text-[var(--ink-soft)]/60 italic">{lastBookingFormatted}</span>
                        )}
                      </td>

                      {/* Total Bookings */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--ink)]">
                          {c.totalBookings || 0} {c.totalBookings === 1 ? "booking" : "bookings"}
                        </span>
                      </td>

                      {/* Referral Code */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-[var(--ink-soft)]">
                        {c.referralCode || "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/clients/${c._id}`}
                            className="border border-[var(--border-color)] hover:border-[#c8a86b] hover:text-[var(--ink)] px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => void toggleBan(c)}
                            className={`border px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                              c.banned
                                ? "border-emerald-800 text-emerald-500 hover:bg-emerald-500/10 font-bold"
                                : "border-rose-950/40 text-rose-500/90 hover:bg-rose-500/10 font-bold"
                            }`}
                          >
                            {c.banned ? "Unban" : "Ban"}
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => void handleDelete(c._id)}
                            className="border border-rose-900/40 text-rose-500 hover:bg-rose-500/10 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controller */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4 mt-2">
          <span className="text-xs text-[var(--ink-soft)] font-medium">
            Showing {clients.length} of {totalClients} clients (Page {page} of {totalPages})
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="border border-[var(--border-color)] hover:border-[#c8a86b] hover:text-[var(--ink)] text-[var(--ink-soft)] text-xs font-semibold rounded-xl px-4 py-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page === totalPages || loading}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="border border-[var(--border-color)] hover:border-[#c8a86b] hover:text-[var(--ink)] text-[var(--ink-soft)] text-xs font-semibold rounded-xl px-4 py-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
