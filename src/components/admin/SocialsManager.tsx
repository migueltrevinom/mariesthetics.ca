"use client";

import { useState } from "react";
import { SocialIcon } from "@/components/ui/SocialIcon";

export interface SocialItem {
  _id: string;
  platform: string;
  label: string;
  url: string;
  active: boolean;
  sortOrder: number;
}

const PLATFORM_PRESETS = [
  { value: "instagram", label: "Instagram", icon: "📸", defaultUrl: "https://instagram.com/mariesthetics" },
  { value: "facebook", label: "Facebook", icon: "👤", defaultUrl: "https://facebook.com/mariesthetics" },
  { value: "tiktok", label: "TikTok", icon: "🎵", defaultUrl: "https://tiktok.com/@mariesthetics" },
  { value: "whatsapp", label: "WhatsApp", icon: "💬", defaultUrl: "https://wa.me/18257853081" },
  { value: "youtube", label: "YouTube", icon: "▶️", defaultUrl: "https://youtube.com/@mariesthetics" },
  { value: "pinterest", label: "Pinterest", icon: "📌", defaultUrl: "https://pinterest.com/mariesthetics" },
  { value: "x", label: "X / Twitter", icon: "🐦", defaultUrl: "https://x.com/mariesthetics" },
  { value: "custom", label: "Custom Link", icon: "🔗", defaultUrl: "https://" },
];

export function SocialsManager({ initialSocials = [] }: { initialSocials?: SocialItem[] }) {
  const [socials, setSocials] = useState<SocialItem[]>(initialSocials);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Editor Visibility & State
  const [showForm, setShowForm] = useState(false);
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
    setShowForm(true);
  };

  const handleSelectPreset = (preset: typeof PLATFORM_PRESETS[0]) => {
    setPlatform(preset.value);
    setLabel(preset.label);
    if (!url || url === "https://" || PLATFORM_PRESETS.some(p => p.defaultUrl === url)) {
      setUrl(preset.defaultUrl);
    }
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
    setShowForm(true);
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
      setShowForm(false);
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

  const currentIcon = PLATFORM_PRESETS.find((p) => p.value === platform)?.icon || "🔗";

  return (
    <div className="space-y-8 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-[var(--ink)]">
            Social Media Channels &amp; Links
          </h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Configure social profiles displayed across your public website footer and client receipts.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={handleOpenNew}
            className="btn-primary inline-flex items-center gap-2 text-xs px-6 py-3 shadow-lg self-start sm:self-auto"
          >
            <span>＋ Add Social Channel</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between">
          <span>✓ {message}</span>
          <button type="button" onClick={() => setMessage("")} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError("")} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Editor Modal / Card (Luxurious Service-Style Editor) */}
      {showForm && (
        <div className="border border-[#c8a86b]/40 bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 transition-all animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <div>
              <h2 className="text-lg font-[family-name:var(--font-display)] text-[var(--ink)]">
                {editingId ? "Modify Social Channel" : "Configure New Social Channel"}
              </h2>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                Select a platform preset below or enter a custom web link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 transition-colors"
            >
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Step 1: Select Platform Preset */}
            <div>
              <label className="block text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-2.5">
                1. Select Platform Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PLATFORM_PRESETS.map((preset) => {
                  const isSelected = platform === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-[#c8a86b] bg-[#c8a86b]/15 text-[#c8a86b] shadow-sm"
                          : "border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[var(--border-color)]"
                      }`}
                    >
                      <SocialIcon platform={preset.value} className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#c8a86b]" : "text-[var(--ink-soft)]"}`} />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Channel Details */}
            <div className="grid gap-5 sm:grid-cols-2 pt-2 border-t border-[var(--border-color)]">
              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                  Display Label
                </label>
                <input
                  placeholder="e.g. Instagram"
                  style={{ backgroundColor: "var(--card-bg)" }}
                  className="w-full border border-[var(--border-color)] px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                  URL Address (Web Link)
                </label>
                <input
                  placeholder="e.g. https://instagram.com/mariesthetics"
                  style={{ backgroundColor: "var(--card-bg)" }}
                  className="w-full border border-[var(--border-color)] px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors font-mono"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2.5 text-xs text-[var(--ink)] font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-5 h-5 rounded border-[var(--border-color)] text-[#2f5d4a] focus:ring-[#2f5d4a]"
                  />
                  Visible on Live Website Footer
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--ink-soft)] font-semibold uppercase tracking-wider">Display Order:</label>
                  <input
                    type="number"
                    min="0"
                    className="w-16 border border-[var(--border-color)] px-2 py-1.5 text-xs text-[var(--ink)] rounded-xl text-center font-bold"
                    style={{ backgroundColor: "var(--card-bg)" }}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="sm:col-span-2 bg-black/5 dark:bg-black/30 border border-[var(--border-color)] p-4 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-[var(--ink-soft)] tracking-wider mb-2">
                  🔍 Live Footer Badge Preview
                </p>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--ink)] shadow-sm">
                    <SocialIcon platform={platform} className="w-3.5 h-3.5 text-[#c8a86b]" />
                    <span>{label || "Channel Label"}</span>
                  </div>
                  <span className="text-xs text-[var(--ink-soft)] font-mono truncate">
                    {url || "https://..."}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-4 border-t border-[var(--border-color)] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="btn-ghost text-xs px-5 py-2.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs px-8 py-3 shadow-lg"
              >
                {saving ? "Saving Changes..." : editingId ? "Update Social Channel" : "Save Social Channel"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Social Channels Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider">
            Active Social Channels ({socials.length})
          </h2>
          <span className="text-xs text-[var(--ink-soft)]">
            Click &quot;Edit&quot; or toggle visibility anytime
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-[var(--ink-soft)] animate-pulse border border-[var(--border-color)] rounded-2xl">
            Loading social channels...
          </div>
        ) : socials.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[var(--border-color)] bg-[var(--card-bg)] rounded-3xl space-y-3">
            <div className="text-3xl">📱</div>
            <p className="text-sm font-semibold text-[var(--ink)]">No social channels configured yet</p>
            <p className="text-xs text-[var(--ink-soft)] max-w-sm mx-auto">
              Add your Instagram, Facebook, TikTok, or WhatsApp links so clients can connect with your studio.
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="btn-primary text-xs px-6 py-2.5 shadow-md mt-2"
            >
              ＋ Add Your First Social Channel
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {socials.map((item) => {
              return (
                <div
                  key={item._id}
                  className={`border rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 ${
                    item.active
                      ? "border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm hover:border-[#c8a86b]/50"
                      : "border-dashed border-[var(--border-color)] opacity-60 bg-black/5 dark:bg-black/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="p-3 rounded-2xl bg-black/5 dark:bg-white/10 select-none shrink-0 border border-[var(--border-color)] text-[#c8a86b]">
                        <SocialIcon platform={item.platform} className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base text-[var(--ink)] truncate">
                            {item.label}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-color)] text-[var(--ink-soft)] uppercase font-mono">
                            #{item.sortOrder}
                          </span>
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[var(--ink-soft)] hover:text-[#c8a86b] truncate block font-mono mt-1"
                        >
                          {item.url} ↗
                        </a>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold border transition-all shrink-0 ${
                        item.active
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {item.active ? "✓ Active" : "Hidden"}
                    </button>
                  </div>

                  <div className="border-t border-[var(--border-color)] pt-3 flex items-center justify-between text-xs">
                    <div className="text-[11px] text-[var(--ink-soft)]">
                      {item.active ? "Visible in website footer" : "Hidden from website footer"}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id, item.label)}
                        className="text-xs text-rose-500 hover:text-rose-600 border border-rose-500/20 rounded-xl px-3 py-1.5 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
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
