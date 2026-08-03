"use client";

import { useState } from "react";

type ReelItem = {
  _id: string;
  platform: string;
  videoUrl: string;
  thumbnailUrl: string;
  externalUrl: string;
  caption: string;
  serviceName: string;
  active: boolean;
  sortOrder: number;
};

type ReelForm = Omit<ReelItem, "_id"> & { id?: string };

export function ReelsManager({
  initialReels,
  initialShowcaseVisible,
}: {
  initialReels: ReelItem[];
  initialShowcaseVisible: boolean;
}) {
  const [reels, setReels] = useState<ReelItem[]>(initialReels);
  const [showcaseVisible, setShowcaseVisible] = useState(initialShowcaseVisible);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<ReelItem | null>(null);
  const [form, setForm] = useState<ReelForm>({
    platform: "instagram",
    videoUrl: "",
    thumbnailUrl: "",
    externalUrl: "",
    caption: "",
    serviceName: "",
    active: true,
    sortOrder: 0,
  });

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const showErr = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

  // ── Toggle showcase visibility ──
  async function toggleShowcase() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reels/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !showcaseVisible }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle");
      setShowcaseVisible(data.showcaseVisible);
      showMsg(data.message);
    } catch (err: any) {
      showErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Save reel (create or update) ──
  async function handleSave() {
    if (!form.videoUrl || !form.thumbnailUrl) {
      showErr("Video URL and Thumbnail URL are required.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, id: editingReel?._id };
      const res = await fetch("/api/admin/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save reel");

      // Refresh list
      const refreshRes = await fetch("/api/admin/reels");
      const refreshData = await refreshRes.json();
      if (refreshRes.ok) setReels(refreshData.reels || []);

      setIsModalOpen(false);
      setEditingReel(null);
      showMsg(editingReel ? "Reel updated successfully!" : "Reel created successfully!");
    } catch (err: any) {
      showErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Delete reel ──
  async function handleDelete(id: string) {
    if (!confirm("Remove this reel permanently?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reels?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete reel");
      setReels((prev) => prev.filter((r) => r._id !== id));
      showMsg("Reel removed.");
    } catch (err: any) {
      showErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Toggle individual reel active status ──
  async function toggleActive(reel: ReelItem) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reel, id: reel._id, active: !reel.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle");
      setReels((prev) =>
        prev.map((r) => (r._id === reel._id ? { ...r, active: !r.active } : r))
      );
    } catch (err: any) {
      showErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Open modal ──
  function openCreate() {
    setEditingReel(null);
    setForm({
      platform: "instagram",
      videoUrl: "",
      thumbnailUrl: "",
      externalUrl: "",
      caption: "",
      serviceName: "",
      active: true,
      sortOrder: reels.length,
    });
    setIsModalOpen(true);
  }

  function openEdit(reel: ReelItem) {
    setEditingReel(reel);
    setForm({
      platform: reel.platform,
      videoUrl: reel.videoUrl,
      thumbnailUrl: reel.thumbnailUrl,
      externalUrl: reel.externalUrl,
      caption: reel.caption,
      serviceName: reel.serviceName,
      active: reel.active,
      sortOrder: reel.sortOrder,
    });
    setIsModalOpen(true);
  }

  const inputCls =
    "w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] transition-colors";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-[var(--ink)]">
            🎬 Social Reels Showcase
          </h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Manage Instagram and TikTok reels displayed on the public landing page.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary text-xs !py-2.5 !px-5 font-bold flex items-center gap-1.5"
        >
          <span>+</span> Add New Reel
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          ✓ {message}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Global Show/Hide Toggle */}
      <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
            <span>{showcaseVisible ? "🟢" : "🔴"}</span>
            <span>
              {showcaseVisible
                ? "Social Reels Visible on Landing Page"
                : "Social Reels Hidden from Landing Page"}
            </span>
          </h3>
          <p className="text-[11px] text-[var(--ink-soft)] mt-0.5">
            Toggle the reel showcase band on the public website between Testimonials and FAQ sections.
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void toggleShowcase()}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
            showcaseVisible
              ? "border-amber-500/40 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              : "border-emerald-500/40 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          }`}
        >
          {showcaseVisible ? "Hide from Landing" : "Show on Landing"}
        </button>
      </div>

      {/* Reels Grid */}
      {reels.length === 0 ? (
        <div className="text-center py-16 text-[var(--ink-soft)]">
          <div className="text-4xl mb-3">🎬</div>
          <p className="text-sm font-semibold">No reels added yet</p>
          <p className="text-xs mt-1">
            Click "Add New Reel" to showcase your Instagram or TikTok content.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {reels.map((reel) => (
            <div
              key={reel._id}
              className={`border rounded-2xl overflow-hidden bg-[var(--card-bg)] transition-all duration-200 hover:shadow-lg group ${
                reel.active
                  ? "border-[var(--border-color)]"
                  : "border-rose-500/30 opacity-60"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[9/16] bg-black/20 overflow-hidden">
                {reel.thumbnailUrl ? (
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.caption || "Reel thumbnail"}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl text-[var(--ink-soft)]">
                    🎥
                  </div>
                )}

                {/* Platform badge */}
                <span
                  className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
                    reel.platform === "instagram"
                      ? "bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white"
                      : "bg-black/70 text-white"
                  }`}
                >
                  {reel.platform === "instagram" ? "IG" : "TT"}
                </span>

                {/* Active badge */}
                <span
                  className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-sm ${
                    reel.active
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {reel.active ? "Active" : "Hidden"}
                </span>

                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <span className="text-white text-xl ml-0.5">▶</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                {reel.caption && (
                  <p className="text-xs font-semibold text-[var(--ink)] leading-snug truncate">
                    {reel.caption}
                  </p>
                )}
                {reel.serviceName && (
                  <span className="inline-block text-[10px] font-bold text-[#c8a86b] bg-[#c8a86b]/10 border border-[#c8a86b]/20 px-2 py-0.5 rounded-lg">
                    {reel.serviceName}
                  </span>
                )}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => openEdit(reel)}
                    className="flex-1 text-[10px] font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] rounded-lg py-1.5 transition-colors cursor-pointer"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(reel)}
                    disabled={loading}
                    className="flex-1 text-[10px] font-bold border rounded-lg py-1.5 transition-colors cursor-pointer disabled:opacity-50 border-[var(--border-color)] text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  >
                    {reel.active ? "👁 Hide" : "👁 Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(reel._id)}
                    disabled={loading}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg py-1.5 px-2.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl max-w-lg w-full text-left space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <h3 className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--ink)]">
                {editingReel ? "Edit Reel" : "Add New Reel"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] px-2.5 py-1 rounded-lg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Platform */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Platform
                </label>
                <div className="flex gap-2">
                  {(["instagram", "tiktok"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, platform: p })}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        form.platform === p
                          ? p === "instagram"
                            ? "border-purple-500/50 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300"
                            : "border-white/30 bg-black/30 text-white"
                          : "border-[var(--border-color)] text-[var(--ink-soft)]"
                      }`}
                    >
                      {p === "instagram" ? "📸 Instagram" : "🎵 TikTok"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Video URL (MP4 / WebM) *
                </label>
                <input
                  type="url"
                  placeholder="https://cdn.example.com/reel.mp4"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  className={inputCls}
                />
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Thumbnail Image URL *
                </label>
                <input
                  type="url"
                  placeholder="https://cdn.example.com/thumbnail.jpg"
                  value={form.thumbnailUrl}
                  onChange={(e) =>
                    setForm({ ...form, thumbnailUrl: e.target.value })
                  }
                  className={inputCls}
                />
              </div>

              {/* External URL */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Original Post URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://www.instagram.com/reel/..."
                  value={form.externalUrl}
                  onChange={(e) =>
                    setForm({ ...form, externalUrl: e.target.value })
                  }
                  className={inputCls}
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Caption
                </label>
                <input
                  type="text"
                  placeholder="Glowing skin transformation ✨"
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  className={inputCls}
                />
              </div>

              {/* Service Name */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Associated Service (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Signature Facial"
                  value={form.serviceName}
                  onChange={(e) =>
                    setForm({ ...form, serviceName: e.target.value })
                  }
                  className={inputCls}
                />
              </div>

              {/* Sort Order + Active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: Number(e.target.value) })
                    }
                    className={inputCls}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2.5 text-sm text-[var(--ink-soft)] font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.active}
                      className="w-5 h-5 rounded border-[var(--border-color)] text-[#2f5d4a] focus:ring-[#2f5d4a]"
                      onChange={(e) =>
                        setForm({ ...form, active: e.target.checked })
                      }
                    />
                    Active
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs border border-[var(--border-color)] rounded-xl text-[var(--ink-soft)] font-semibold hover:text-[var(--ink)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !form.videoUrl || !form.thumbnailUrl}
                onClick={() => void handleSave()}
                className="btn-primary text-xs !py-2.5 !px-6 disabled:opacity-40 font-bold cursor-pointer"
              >
                {loading
                  ? "Saving..."
                  : editingReel
                  ? "Update Reel"
                  : "Create Reel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
