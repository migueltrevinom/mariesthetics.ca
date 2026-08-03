"use client";

import { useState } from "react";

export type CategoryRow = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  sortOrder: number;
  imageUrl?: string;
};

export function CategoriesManager({
  initialCategories,
}: {
  initialCategories: CategoryRow[];
}) {
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    active: true,
    sortOrder: 0,
    imageUrl: "",
  });

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const showErr = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

  const openCreate = () => {
    setEditingCat(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      active: true,
      sortOrder: categories.length + 1,
      imageUrl: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditingCat(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      active: cat.active,
      sortOrder: cat.sortOrder,
      imageUrl: cat.imageUrl || "",
    });
    setIsModalOpen(true);
  };

  async function handleSave() {
    if (!form.name.trim()) {
      showErr("Category name is required.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        id: editingCat?._id,
      };
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save category");

      // Refresh list
      const refreshRes = await fetch("/api/admin/categories");
      const refreshData = await refreshRes.json();
      if (refreshRes.ok) setCategories(refreshData.categories || []);

      setIsModalOpen(false);
      setEditingCat(null);
      showMsg(editingCat ? "Category updated!" : "Category created successfully!");
    } catch (err: any) {
      showErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete category "${name}"? Services assigned to this category will fall back to general.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete category");
      setCategories((prev) => prev.filter((c) => c._id !== id));
      showMsg("Category deleted.");
    } catch (err: any) {
      showErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(cat: CategoryRow) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cat._id,
          name: cat.name,
          slug: cat.slug,
          active: !cat.active,
          sortOrder: cat.sortOrder,
          description: cat.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle");
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, active: !c.active } : c))
      );
    } catch (err: any) {
      showErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] transition-colors";

  return (
    <div className="space-y-6 text-[var(--ink)]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">
            🏷️ Service Categories
          </h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Manage treatment categories, custom blurb copy, and order displayed across the website and booking wizard.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary text-xs !py-2.5 !px-5 font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <span>+</span> Add New Category
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
          ✓ {message}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Categories Grid Table */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--ink-soft)] uppercase font-bold tracking-wider text-[10px]">
                <th className="p-4">Sort</th>
                <th className="p-4">Category Name</th>
                <th className="p-4">Slug Key</th>
                <th className="p-4">Description / Subtitle</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--ink-soft)] italic">
                    No categories found. Click "Add New Category" to create your first dynamic category.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono font-bold text-[#c8a86b]">
                      #{cat.sortOrder}
                    </td>
                    <td className="p-4 font-bold text-sm text-[var(--ink)]">
                      {cat.name}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-md bg-black/10 dark:bg-white/10 font-mono text-[10px] text-[var(--ink-soft)]">
                        {cat.slug}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--ink-soft)] max-w-xs truncate">
                      {cat.description || "—"}
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => void toggleActive(cat)}
                        disabled={loading}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          cat.active
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {cat.active ? "● Active (Visible)" : "○ Hidden"}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="px-3 py-1.5 border border-[var(--border-color)] rounded-xl text-xs font-semibold hover:border-[#c8a86b] transition-all cursor-pointer"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(cat._id, cat.name)}
                        disabled={loading}
                        className="px-3 py-1.5 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl max-w-lg w-full text-left space-y-5 shadow-2xl relative animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <h3 className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--ink)]">
                {editingCat ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] px-2.5 py-1 rounded-lg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Category Display Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Facials & Skin Care"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                    setForm({
                      ...form,
                      name,
                      slug: editingCat ? form.slug : autoSlug,
                    });
                  }}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Slug Key (URL / System Code)
                </label>
                <input
                  type="text"
                  placeholder="facials"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className={inputCls}
                />
                <span className="text-[10px] text-[var(--ink-soft)] mt-0.5 block">
                  Unique identifier used in URLs and service filtering (e.g. `facials`, `lashes`, `brows`).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Description / Subtitle Blurb
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Customized facials & skin rejuvenation for healthy glowing skin."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2.5 text-sm text-[var(--ink-soft)] font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.active}
                      className="w-5 h-5 rounded border-[var(--border-color)] text-[#2f5d4a] focus:ring-[#2f5d4a]"
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    />
                    <span>Active (Show on website)</span>
                  </label>
                </div>
              </div>
            </div>

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
                disabled={loading || !form.name.trim()}
                onClick={() => void handleSave()}
                className="btn-primary text-xs !py-2.5 !px-6 disabled:opacity-40 font-bold cursor-pointer"
              >
                {loading ? "Saving..." : editingCat ? "Update Category" : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
