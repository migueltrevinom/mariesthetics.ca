"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type ClientRow = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  banned: boolean;
  referralCode?: string;
  subscription?: any;
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
      setClients(data.clients);
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
            Clients
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)] max-w-xl">
            Directory of client accounts registered via email OTP. Adjust permissions, manage active memberships, or restrict account scopes below.
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

      {/* Display listing of clients */}
      <div className="grid gap-4 w-full">
        {clients.map((c) => (
          <div
            key={c._id}
            className={`border p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-200 ${
              (c.active !== false) && !c.banned
                ? "border-[var(--border-color)] bg-[var(--card-bg)]"
                : c.banned
                ? "border-red-950 bg-red-950/5 opacity-80"
                : "border-[var(--border-color)]/50 bg-black/10 opacity-70"
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-semibold text-lg text-[var(--ink)] truncate">{c.name}</span>
                
                {/* Status badges */}
                {c.banned && (
                  <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
                    Banned
                  </span>
                )}
                {!c.banned && (c.active !== false) && (
                  <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400">
                    Active
                  </span>
                )}
                {!c.banned && (c.active === false) && (
                  <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
                    Inactive
                  </span>
                )}
                {c.subscription && (
                  <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border border-[#c8a86b]/40 bg-[#c8a86b]/10 text-[#c8a86b]">
                    Subscribed Membership
                  </span>
                )}
              </div>

              <p className="text-xs text-[var(--ink-soft)] mt-1.5 font-medium">
                {c.email} · {c.phone || "No phone number added"}
              </p>

              <p className="text-[10px] text-[var(--ink-soft)]/75 mt-1 font-semibold">
                Referral Code: <span className="text-[var(--ink)]">{c.referralCode || "—"}</span>
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-[var(--border-color)] pt-3 md:pt-0">
              <Link
                href={`/admin/clients/${c._id}`}
                className="flex-1 md:flex-none border border-[var(--border-color)] hover:border-[#c8a86b] hover:text-[var(--ink)] hover:bg-[var(--card-bg)] px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer text-center block"
              >
                Edit
              </Link>
              <button
                type="button"
                disabled={loading}
                onClick={() => void toggleBan(c)}
                className={`flex-1 md:flex-none border px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer text-center ${
                  c.banned
                    ? "border-green-800 text-green-400 hover:bg-green-500/10 font-bold"
                    : "border-red-950 hover:border-red-500 hover:text-red-400 hover:bg-red-500/10 text-red-500/80 font-bold"
                }`}
              >
                {c.banned ? "Unban" : "Ban"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleDelete(c._id)}
                className="flex-1 md:flex-none border border-red-900/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer text-center"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <p className="text-sm text-[var(--ink-soft)] italic text-center py-12">
            {loading ? "Loading clients..." : "No clients match your filter or search criteria."}
          </p>
        )}
      </div>

      {/* Pagination controller */}
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
