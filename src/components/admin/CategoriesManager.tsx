"use client";

import { useState } from "react";
import { formatCad } from "@/lib/money";

export type CategoryRow = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  sortOrder: number;
  imageUrl?: string;
};

export type CategoryServiceItem = {
  _id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  depositCents: number;
  category: string;
  active: boolean;
};

export function CategoriesManager({
  initialCategories,
  initialServices = [],
}: {
  initialCategories: CategoryRow[];
  initialServices?: CategoryServiceItem[];
}) {
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);
  const [services, setServices] = useState<CategoryServiceItem[]>(initialServices);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Modal controls for Edit/Create Category
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

  // Side Drawer state for category details & service linking
  const [drawerCategory, setDrawerCategory] = useState<CategoryRow | null>(null);
  const [unlinkedSearch, setUnlinkedSearch] = useState("");
  const [reassigningServiceId, setReassigningServiceId] = useState<string | null>(null);

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

  const openEdit = (cat: CategoryRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
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

      // Refresh categories list
      const refreshRes = await fetch("/api/admin/categories");
      const refreshData = await refreshRes.json();
      if (refreshRes.ok) setCategories(refreshData.categories || []);

      // Update drawer if open
      if (drawerCategory && editingCat && drawerCategory._id === editingCat._id) {
        setDrawerCategory(data.category);
      }

      setIsModalOpen(false);
      setEditingCat(null);
      showMsg(editingCat ? "Category updated!" : "Category created successfully!");
    } catch (err: any) {
      showErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!confirm(`Are you sure you want to delete category "${name}"? Services assigned to this category will fall back to general.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete category");
      setCategories((prev) => prev.filter((c) => c._id !== id));
      if (drawerCategory?._id === id) setDrawerCategory(null);
      showMsg("Category deleted.");
    } catch (err: any) {
      showErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(cat: CategoryRow, e?: React.MouseEvent) {
    e?.stopPropagation();
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
      if (drawerCategory?._id === cat._id) {
        setDrawerCategory((prev) => (prev ? { ...prev, active: !prev.active } : null));
      }
    } catch (err: any) {
      showErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Quick Service Category Reassignment ──
  async function reassignServiceCategory(serviceId: string, targetCategorySlug: string) {
    setReassigningServiceId(serviceId);
    try {
      const res = await fetch("/api/admin/services/category", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, categorySlug: targetCategorySlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reassign service category");

      // Update local services state
      setServices((prev) =>
        prev.map((s) => (s._id === serviceId ? { ...s, category: targetCategorySlug } : s))
      );
      showMsg(data.message || "Service category updated!");
    } catch (err: any) {
      showErr(err.message);
    } finally {
      setReassigningServiceId(null);
    }
  }

  const inputCls =
    "w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] transition-colors";

  // Filter linked & unlinked services for selected drawer category
  const linkedServices = drawerCategory
    ? services.filter((s) => s.category === drawerCategory.slug)
    : [];

  const unlinkedServices = drawerCategory
    ? services.filter(
        (s) =>
          s.category !== drawerCategory.slug &&
          (s.name.toLowerCase().includes(unlinkedSearch.toLowerCase()) ||
            s.category.toLowerCase().includes(unlinkedSearch.toLowerCase()))
      )
    : [];

  return (
    <div className="space-y-6 text-[var(--ink)] relative">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">
            🏷️ Service Categories &amp; Service Mapping
          </h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Click any category to open the side panel drawer and manage linked studio services.
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
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
          ✓ {message}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold animate-in fade-in duration-200">
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
                <th className="p-4">Linked Treatments</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--ink-soft)] italic">
                    No categories found. Click "Add New Category" to create your first dynamic category.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const count = services.filter((s) => s.category === cat.slug).length;
                  const isDrawerOpen = drawerCategory?._id === cat._id;

                  return (
                    <tr
                      key={cat._id}
                      onClick={() => setDrawerCategory(cat)}
                      className={`cursor-pointer transition-colors ${
                        isDrawerOpen
                          ? "bg-[#c8a86b]/[0.08] dark:bg-[#c8a86b]/[0.05]"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="p-4 font-mono font-bold text-[#c8a86b]">
                        #{cat.sortOrder}
                      </td>
                      <td className="p-4 font-bold text-sm text-[var(--ink)]">
                        <div className="flex items-center gap-2">
                          <span>{cat.name}</span>
                          {isDrawerOpen && (
                            <span className="text-[10px] bg-[#c8a86b] text-black px-1.5 py-0.5 rounded font-bold">
                              OPEN
                            </span>
                          )}
                        </div>
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
                        <span className="px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-[11px]">
                          {count} Service{count === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={(e) => void toggleActive(cat, e)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrawerCategory(cat);
                          }}
                          className="px-3 py-1.5 border border-[#c8a86b]/50 bg-[#c8a86b]/10 text-[#c8a86b] rounded-xl text-xs font-bold hover:bg-[#c8a86b]/20 transition-all cursor-pointer"
                        >
                          📋 Manage Services →
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openEdit(cat, e)}
                          className="px-3 py-1.5 border border-[var(--border-color)] rounded-xl text-xs font-semibold hover:border-[#c8a86b] transition-all cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => void handleDelete(cat._id, cat.name, e)}
                          disabled={loading}
                          className="px-3 py-1.5 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SIDE PANEL DRAWER: CATEGORY SERVICES MANAGER ── */}
      {drawerCategory && (
        <div className="fixed inset-0 z-[110] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[var(--card-bg)] border-l border-[var(--border-color)] h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#c8a86b]">
                      Category Side Drawer
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 font-mono text-[10px] text-[var(--ink-soft)]">
                      {drawerCategory.slug}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-[var(--ink)]">
                    {drawerCategory.name}
                  </h2>
                  {drawerCategory.description && (
                    <p className="text-xs text-[var(--ink-soft)] mt-1">
                      {drawerCategory.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerCategory(null)}
                  className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Category Quick Actions */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-xs">
                <span className="font-semibold text-[var(--ink-soft)]">Category Status:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => void toggleActive(drawerCategory, e)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      drawerCategory.active
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {drawerCategory.active ? "Active" : "Hidden"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openEdit(drawerCategory, e)}
                    className="px-3 py-1 border border-[var(--border-color)] text-[var(--ink)] rounded-lg font-semibold hover:border-[#c8a86b]"
                  >
                    Edit Copy
                  </button>
                </div>
              </div>

              {/* SECTION 1: LINKED SERVICES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                    <span>✅ Currently Linked Services</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#c8a86b]/20 text-[#c8a86b] text-[10px]">
                      {linkedServices.length}
                    </span>
                  </h3>
                </div>

                {linkedServices.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-[var(--border-color)] text-center text-xs text-[var(--ink-soft)] italic">
                    No services currently assigned to this category. Select treatments below to link them.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedServices.map((service) => (
                      <div
                        key={service._id}
                        className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.02] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[var(--ink)] truncate">
                              {service.name}
                            </span>
                            {!service.active && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--ink-soft)] pt-0.5 font-mono">
                            {formatCad(service.priceCents)} · {service.durationMin} mins
                          </div>
                        </div>

                        {/* Reassign dropdown selector */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            disabled={reassigningServiceId === service._id}
                            style={{ backgroundColor: "var(--card-bg)" }}
                            className="border border-[var(--border-color)] px-2.5 py-1 text-xs text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b] cursor-pointer"
                            value={service.category}
                            onChange={(e) =>
                              void reassignServiceCategory(service._id, e.target.value)
                            }
                          >
                            {categories.map((c) => (
                              <option key={c.slug} value={c.slug}>
                                {c.name}
                              </option>
                            ))}
                            <option value="general">General (Unassigned)</option>
                          </select>

                          <button
                            type="button"
                            title="Unlink (Move to General)"
                            disabled={reassigningServiceId === service._id}
                            onClick={() => void reassignServiceCategory(service._id, "general")}
                            className="p-1.5 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-500/10 cursor-pointer text-xs"
                          >
                            Unlink
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: LINK UNASSIGNED / OTHER SERVICES */}
              <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                    <span>➕ Link Additional Services</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[var(--ink-soft)] text-[10px]">
                      {unlinkedServices.length} Available
                    </span>
                  </h3>
                  <input
                    type="text"
                    placeholder="Search treatments..."
                    value={unlinkedSearch}
                    onChange={(e) => setUnlinkedSearch(e.target.value)}
                    className="px-3 py-1 border border-[var(--border-color)] bg-[var(--background)] text-xs text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b]"
                  />
                </div>

                {unlinkedServices.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[var(--ink-soft)] italic">
                    All studio services are already linked to this category!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                    {unlinkedServices.map((service) => (
                      <div
                        key={service._id}
                        className="p-3 rounded-2xl border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.01] flex items-center justify-between gap-3 hover:border-[#c8a86b]/40 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-[var(--ink)] truncate">
                            {service.name}
                          </div>
                          <div className="text-[10px] text-[var(--ink-soft)] flex items-center gap-1.5 pt-0.5">
                            <span>Current:</span>
                            <span className="font-mono text-[#c8a86b] font-semibold">
                              {categories.find((c) => c.slug === service.category)?.name || service.category}
                            </span>
                            <span>· {formatCad(service.priceCents)}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={reassigningServiceId === service._id}
                          onClick={() => void reassignServiceCategory(service._id, drawerCategory.slug)}
                          className="px-3 py-1.5 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {reassigningServiceId === service._id
                            ? "Linking..."
                            : `＋ Link to ${drawerCategory.name}`}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)] text-right">
              <button
                type="button"
                onClick={() => setDrawerCategory(null)}
                className="btn-primary text-xs !py-2 !px-6 font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT CATEGORY MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
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
