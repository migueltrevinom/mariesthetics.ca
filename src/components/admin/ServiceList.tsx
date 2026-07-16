"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { formatCad } from "@/lib/money";

export type ServiceRow = {
  id?: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  depositCents: number;
  active: boolean;
  sortOrder: number;
  category: string;
  photos: string[];
};

interface ServiceListProps {
  services: ServiceRow[];
}

const CATEGORIES = [
  { value: "all", label: "All Category" },
  { value: "facials", label: "Facials" },
  { value: "lashes", label: "Lashes" },
  { value: "permanentMakeUp", label: "Permanent Make-Up" },
];

export function ServiceList({ services }: ServiceListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  async function remove(id: string) {
    if (!window.confirm("Are you sure you want to delete this service permanently? This action cannot be undone.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/services?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete service");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(row: ServiceRow) {
    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          name: row.name,
          description: row.description,
          durationMin: row.durationMin,
          priceCents: row.priceCents,
          depositCents: row.depositCents,
          category: row.category,
          sortOrder: row.sortOrder,
          photos: row.photos,
          active: !row.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to toggle service status");
    } finally {
      setLoading(false);
    }
  }

  // Filter logic
  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory =
      selectedCategory === "all" || s.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 w-full text-left">
      
      {/* Search & Filter Controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl shadow-sm">
        
        {/* Search input field */}
        <div className="relative flex-1 max-w-md w-full">
          <input
            type="text"
            placeholder="Search service name, description, category..."
            style={{ backgroundColor: "var(--card-bg)" }}
            className="w-full border border-[var(--border-color)] px-4 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus-visible:outline-none focus:border-[#c8a86b] focus:ring-1 focus:ring-[#c8a86b] placeholder-[var(--ink-soft)]/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-3 text-[var(--ink-soft)] hover:text-[var(--ink)] text-xs cursor-pointer font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills Filters */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer text-center whitespace-nowrap ${
                selectedCategory === cat.value
                  ? "bg-[#2f5d4a] text-white border-transparent shadow-sm"
                  : "border-[var(--border-color)] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-white/[0.02]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* Services Cards List */}
      <div className="grid gap-4 w-full">
        {filteredServices.map((row) => (
          <div
            key={row.id}
            className={`border p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-200 ${
              row.active 
                ? "border-[var(--border-color)] bg-[var(--card-bg)]" 
                : "border-[var(--border-color)]/50 bg-black/10 opacity-70"
            }`}
          >
            <div className="flex gap-4 items-center min-w-0">
              {/* Primary Photo display */}
              {row.photos && row.photos.length > 0 && row.photos[0] && (
                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-[var(--border-color)] bg-black/20">
                  <img
                    src={row.photos[0]}
                    alt={row.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-lg text-[var(--ink)] truncate">{row.name}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-[#c8a86b]/40 bg-[#c8a86b]/5 text-[#c8a86b]">
                    {row.category === "permanentMakeUp"
                      ? "Permanent Make-Up"
                      : row.category === "facials"
                      ? "Facial"
                      : "Lashes"}
                  </span>
                </div>
                
                <p className="text-xs text-[var(--ink-soft)] mt-1 font-medium">
                  {row.durationMin} minutes duration · Price {formatCad(row.priceCents)} · Deposit {formatCad(row.depositCents)}
                </p>
                
                {row.description && (
                  <p className="text-xs text-[var(--ink-soft)]/80 mt-1 line-clamp-1 italic max-w-xl">
                    "{row.description}"
                  </p>
                )}
                
                {/* Thumbnails strip for remaining photos */}
                {row.photos && row.photos.length > 1 && (
                  <div className="flex gap-1.5 mt-2">
                    {row.photos.slice(1).map((photoUrl, photoIdx) => (
                      <img
                        key={photoIdx}
                        src={photoUrl}
                        alt="Detail thumbnail"
                        className="w-6 h-6 object-cover rounded border border-[var(--border-color)] bg-black/10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1594744803329-e58b31de215f?w=100&auto=format&fit=crop";
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons list */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-[var(--border-color)] pt-3 md:pt-0">
              <Link
                href={`/admin/services/${row.id}`}
                className="flex-1 md:flex-none border border-[var(--border-color)] hover:border-[#c8a86b] hover:text-[var(--ink)] hover:bg-[var(--card-bg)] px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer text-center block"
              >
                Edit
              </Link>
              <button
                type="button"
                disabled={loading}
                onClick={() => void toggleActive(row)}
                className={`flex-1 md:flex-none border px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer text-center ${
                  row.active
                    ? "border-[var(--border-color)] hover:border-amber-500 hover:text-amber-500 hover:bg-amber-500/5 text-[var(--ink-soft)]"
                    : "border-green-800 text-green-500 hover:bg-green-500/10 font-bold"
                }`}
              >
                {row.active ? "Disable" : "Enable"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void remove(row.id!)}
                className="flex-1 md:flex-none border border-red-900/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer text-center"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {filteredServices.length === 0 && (
          <p className="text-sm text-[var(--ink-soft)] italic text-center py-12">No services match your search or filter options.</p>
        )}
      </div>

    </div>
  );
}
