"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatCad } from "@/lib/money";

export interface ProductItem {
  _id: string;
  name: string;
  description: string;
  kind: "full_payment" | "deposit" | "balance" | "custom";
  priceCents: number;
  serviceId?: {
    _id: string;
    name: string;
    priceCents: number;
    depositCents: number;
  } | null;
  stripeProductId?: string;
  stripePriceId?: string;
  active: boolean;
  sku?: string;
  createdAt?: string;
}

export interface ServiceItem {
  _id: string;
  name: string;
  priceCents: number;
  depositCents: number;
}

interface ProductsManagerProps {
  initialProducts: ProductItem[];
  services: ServiceItem[];
}

function ProductsManagerContent({
  initialProducts,
  services,
}: ProductsManagerProps) {
  const searchParams = useSearchParams();
  const initialServiceFilter = searchParams.get("serviceId") || "all";

  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>(initialServiceFilter);

  useEffect(() => {
    const sId = searchParams.get("serviceId");
    if (sId) {
      setServiceFilter(sId);
    }
  }, [searchParams]);
  const [modalOpen, setModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formKind, setFormKind] = useState<"full_payment" | "deposit" | "balance" | "custom">("full_payment");
  const [formPriceDollars, setFormPriceDollars] = useState("");
  const [formServiceId, setFormServiceId] = useState("");
  const [formActive, setFormActive] = useState(true);

  // Auto-generate state
  const [genServiceId, setGenServiceId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reloadProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      // quiet reload
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormDescription("");
    setFormKind("full_payment");
    setFormPriceDollars("");
    setFormServiceId(services[0]?._id || "");
    setFormActive(true);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDescription(p.description || "");
    setFormKind(p.kind);
    setFormPriceDollars((p.priceCents / 100).toFixed(2));
    setFormServiceId(p.serviceId?._id || "");
    setFormActive(p.active);
    setError("");
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const priceCents = Math.round(parseFloat(formPriceDollars || "0") * 100);
      const payload = {
        name: formName,
        description: formDescription,
        kind: formKind,
        priceCents,
        serviceId: formServiceId || null,
        active: formActive,
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct._id}`
        : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      setSuccess(editingProduct ? "Product updated successfully!" : "Product created successfully!");
      setModalOpen(false);
      await reloadProducts();
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      await reloadProducts();
    } catch (err: any) {
      alert(err.message || "Error deleting product");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    if (!genServiceId) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/products/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: genServiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate product variants");

      setSuccess(data.message || "Generated product variants!");
      setGenerateModalOpen(false);
      await reloadProducts();
    } catch (err: any) {
      setError(err.message || "Failed to generate products");
    } finally {
      setLoading(false);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesKind = kindFilter === "all" || p.kind === kindFilter;
    const matchesService =
      serviceFilter === "all" || (p.serviceId && p.serviceId._id === serviceFilter);
    return matchesSearch && matchesKind && matchesService;
  });

  return (
    <div className="space-y-8 text-left w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-color)]">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Products &amp; Service Mapping
          </h2>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5">
            Manage product items, deposits, full payments, and map them to studio services.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setGenServiceId(services[0]?._id || "");
              setGenerateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl border border-[#c8a86b]/40 bg-[#c8a86b]/10 text-[#c8a86b] text-xs font-semibold hover:bg-[#c8a86b]/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>⚡ Auto-Generate Variants</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary text-xs !py-2 !px-4 cursor-pointer shadow-md"
          >
            + Create Product
          </button>
        </div>
      </div>

      {success && (
        <div className="border border-leaf/30 bg-leaf/10 p-4 rounded-xl text-xs text-leaf font-semibold">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="border border-blush/30 bg-blush/10 p-4 rounded-xl text-xs text-blush font-semibold">
          ✕ {error}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
          />
        </div>

        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
        >
          <option value="all">All Linked Services</option>
          {services.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 bg-white/[0.02] border border-[var(--border-color)] p-1 rounded-xl">
          {[
            { key: "all", label: "All" },
            { key: "full_payment", label: "Full Pay" },
            { key: "deposit", label: "Deposit" },
            { key: "balance", label: "Balance" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setKindFilter(item.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                kindFilter === item.key
                  ? "bg-white/[0.08] text-[var(--ink)] border border-[#c8a86b] font-bold"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)] border border-transparent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--ink)]">
            <thead className="bg-white/[0.03] border-b border-[var(--border-color)] uppercase tracking-wider text-[10px] text-[var(--ink-soft)] font-bold">
              <tr>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Kind / Type</th>
                <th className="py-3.5 px-4">Mapped Service</th>
                <th className="py-3.5 px-4 text-right">Price</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredProducts.map((p) => {
                const kindBadgeStyle =
                  p.kind === "full_payment"
                    ? "bg-[#c8a86b]/15 text-[#c8a86b] border-[#c8a86b]/30"
                    : p.kind === "deposit"
                    ? "bg-[#1f4d3a]/20 text-leaf border-[#1f4d3a]/30"
                    : p.kind === "balance"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-purple-500/10 text-purple-400 border-purple-500/20";

                return (
                  <tr key={p._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-4 font-semibold">
                      <p className="text-sm text-[var(--ink)]">{p.name}</p>
                      {p.description && (
                        <p className="text-[11px] text-[var(--ink-soft)] mt-0.5 line-clamp-1">
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${kindBadgeStyle}`}>
                        {p.kind.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {p.serviceId ? (
                        <span className="font-medium text-[var(--ink)] flex items-center gap-1.5">
                          <span className="text-[#c8a86b]">❖</span> {p.serviceId.name}
                        </span>
                      ) : (
                        <span className="text-[var(--ink-soft)] italic">Standalone</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-sm text-[var(--ink)]">
                      {formatCad(p.priceCents)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          p.active
                            ? "bg-leaf/10 text-leaf border-leaf/30"
                            : "bg-blush/10 text-blush border-blush/30"
                        }`}
                      >
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] hover:border-[#c8a86b] text-[11px] font-medium text-[var(--ink)] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p._id)}
                        className="px-2.5 py-1 rounded-lg border border-blush/30 text-blush hover:bg-blush/10 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[var(--ink-soft)] italic">
                    No products found matching filters. Click "+ Create Product" or "Auto-Generate" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-[var(--border-color)] bg-[var(--card-bg)] backdrop-blur-md p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                {editingProduct ? "Edit Product" : "Create New Product"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Lashes - Full payment"
                  className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1">
                    Product Kind / Variant *
                  </label>
                  <select
                    value={formKind}
                    onChange={(e) => setFormKind(e.target.value as any)}
                    className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  >
                    <option value="full_payment">Full Payment</option>
                    <option value="deposit">Deposit</option>
                    <option value="balance">Remaining Balance</option>
                    <option value="custom">Custom Item</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1">
                    Price ($ CAD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="120.00"
                    className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                    value={formPriceDollars}
                    onChange={(e) => setFormPriceDollars(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1">
                  Map to Service (Optional)
                </label>
                <select
                  value={formServiceId}
                  onChange={(e) => setFormServiceId(e.target.value)}
                  className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                >
                  <option value="">-- Standalone / Unlinked --</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({formatCad(s.priceCents)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Details or terms for this product variant..."
                  className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formActive"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="accent-[#c8a86b]"
                />
                <label htmlFor="formActive" className="text-xs text-[var(--ink)] cursor-pointer">
                  Product is Active
                </label>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs !py-2 !px-6 cursor-pointer"
                >
                  {loading ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTO-GENERATE VARIANTS MODAL */}
      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md border border-[var(--border-color)] bg-[var(--card-bg)] backdrop-blur-md p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                Auto-Generate Products
              </h3>
              <button
                type="button"
                onClick={() => setGenerateModalOpen(false)}
                className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              Select a service below to automatically generate 3 mapped products:
              <br />• <strong>Full Payment Product</strong> (${(services.find(s => s._id === genServiceId)?.priceCents || 0) / 100})
              <br />• <strong>Deposit Product</strong> (${(services.find(s => s._id === genServiceId)?.depositCents || 0) / 100})
              <br />• <strong>Remaining Balance Product</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1">
                Target Service
              </label>
              <select
                value={genServiceId}
                onChange={(e) => setGenServiceId(e.target.value)}
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              >
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} (Full: {formatCad(s.priceCents)} · Deposit: {formatCad(s.depositCents)})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGenerateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !genServiceId}
                onClick={handleAutoGenerate}
                className="btn-primary text-xs !py-2 !px-6 cursor-pointer"
              >
                {loading ? "Generating..." : "⚡ Generate 3 Products"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductsManager(props: ProductsManagerProps) {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[var(--ink-soft)] animate-pulse">Loading products manager...</div>}>
      <ProductsManagerContent {...props} />
    </Suspense>
  );
}
