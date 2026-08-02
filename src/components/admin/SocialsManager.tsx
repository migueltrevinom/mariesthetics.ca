"use client";

import { useState, useEffect } from "react";

export interface SocialItem {
  _id: string;
  platform: string;
  label: string;
  url: string;
  active: boolean;
  sortOrder: number;
}

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook", label: "Facebook", icon: "👤" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "whatsapp", label: "WhatsApp", icon: "💬" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "pinterest", label: "Pinterest", icon: "📌" },
  { value: "x", label: "X / Twitter", icon: "🐦" },
  { value: "custom", label: "Custom Link", icon: "🔗" },
];

export function SocialsManager({ initialSocials = [] }: { initialSocials?: SocialItem[] }) {
  const [socials, setSocials] = useState<SocialItem[]>(initialSocials);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Modal / Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [platform, setPlatform] = useState("instagram");
  const [label, setLabel] = useState("Instagram");
  const [url, setUrl] = useState("");
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const fetchSocials = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/socials");
      if (res.ok) {
        const data = await res.json();
        setSocials(data.socials || []);
      }
    } catch {
      setError("Failed to load social links.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setPlatform("instagram");
    setLabel("Instagram");
    setUrl("https://instagram.com/mariesthetics");
    setActive(true);
    setSortOrder(socials.length);
    setError("");
    setMessage("");
  };

  const handleEdit = (item: SocialItem) => {
    setEditingId(item._id);
    setPlatform(item.platform);
    setLabel(item.label);
    setUrl(item.url);
    setActive(item.active);
    setSortOrder(item.sortOrder ?? 0);
    setError("");
    setMessage("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) {
      setError("Label and URL are required.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload: any = {
        platform,
        label,
        url,
        active,
        sortOrder: Number(sortOrder),
      };
      if (editingId) payload.id = editingId;

      const res = await fetch("/api/admin/socials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save social link");

      setMessage(`Saved ${label} successfully!`);
      setEditingId(null);
      void fetchSocials();
    } catch (err: any) {
      setError(err.message || "Failed to save social link");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: SocialItem) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/socials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item._id,
          platform: item.platform,
          label: item.label,
          url: item.url,
          active: !item.active,
          sortOrder: item.sortOrder,
        }),
      });

      if (!res.ok) throw new Error("Failed to toggle status");
      void fetchSocials();
    } catch (err: any) {
      setError(err.message || "Failed to update link status");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, itemLabel: string) => {
    if (!confirm(`Are you sure you want to remove ${itemLabel}?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/socials?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete social link");
      setMessage(`Removed ${itemLabel}`);
      void fetchSocials();
    } catch (err: any) {
      setError(err.message || "Failed to delete link");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-[var(--ink)]">
            Social Media Channels &amp; Links
          </h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Manage your social media presence. Active channels automatically render in your website footer.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenNew}
          className="btn-primary inline-flex items-center gap-2 text-xs px-5 py-2.5 shadow-md self-start sm:self-auto"
        >
          <span>＋ Add Social Channel</span>
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          {message}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Editor Modal / Form inline */}
      {(editingId !== null || url !== "") && (
        <form
          onSubmit={handleSave}
          className="border border-[#c8a86b]/30 bg-black/5 dark:bg-black/30 p-6 rounded-2xl space-y-4 transition-all"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider">
              {editingId ? "Edit Social Channel" : "Add New Social Channel"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setUrl("");
              }}
              className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              ✕ Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                Platform Icon / Type
              </label>
              <select
                style={{ backgroundColor: "var(--card-bg)" }}
                className="w-full border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl cursor-pointer"
                value={platform}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlatform(val);
                  const opt = PLATFORM_OPTIONS.find((p) => p.value === val);
                  if (opt && opt.value !== "custom") {
                    setLabel(opt.label);
                  }
                }}
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[var(--card-bg)] text-[var(--ink)]">
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                Display Label
              </label>
              <input
                placeholder="e.g. Instagram"
                style={{ backgroundColor: "var(--card-bg)" }}
                className="w-full border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                URL Address (Link)
              </label>
              <input
                placeholder="e.g. https://instagram.com/mariesthetics"
                style={{ backgroundColor: "var(--card-bg)" }}
                className="w-full border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl font-mono"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-[var(--ink-soft)] font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border-color)] text-[#2f5d4a] focus:ring-[#2f5d4a]"
                />
                Visible on Site Footer
              </label>

              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--ink-soft)]">Order:</label>
                <input
                  type="number"
                  min="0"
                  className="w-16 border border-[var(--border-color)] px-2 py-1 text-xs text-[var(--ink)] rounded-lg text-center"
                  style={{ backgroundColor: "var(--card-bg)" }}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs px-6 py-2 shadow-md"
            >
              {saving ? "Saving..." : editingId ? "Update Link" : "Save New Link"}
            </button>
          </div>
        </form>
      )}

      {/* Social Links List */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider mb-4">
          Configured Social Channels ({socials.length})
        </h2>

        {loading ? (
          <div className="text-center py-8 text-xs text-[var(--ink-soft)] animate-pulse">
            Loading social channels...
          </div>
        ) : socials.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[var(--border-color)] rounded-xl text-xs text-[var(--ink-soft)]">
            No social channels configured yet. Click <strong>＋ Add Social Channel</strong> above to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {socials.map((item) => {
              const opt = PLATFORM_OPTIONS.find((p) => p.value === item.platform) || { icon: "🔗" };
              return (
                <div
                  key={item._id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                    item.active
                      ? "border-[var(--border-color)] bg-black/5 dark:bg-white/5"
                      : "border-dashed border-[var(--border-color)] opacity-60 bg-black/10 dark:bg-black/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl p-2 rounded-xl bg-black/5 dark:bg-white/10 select-none">
                      {opt.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--ink)] truncate">
                          {item.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-color)] text-[var(--ink-soft)] uppercase font-mono">
                          {item.platform}
                        </span>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--ink-soft)] hover:text-[#c8a86b] truncate block font-mono mt-0.5"
                      >
                        {item.url} ↗
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                        item.active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {item.active ? "✓ Visible" : "Hidden"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id, item.label)}
                      className="text-xs text-rose-500 hover:text-rose-600 border border-rose-500/20 rounded-xl px-3 py-1.5 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
