"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCad } from "@/lib/money";

type ServiceRow = {
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
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  images?: {
    id: string;
    url: string;
    ipfsHash: string;
    type: "service" | "pre" | "post";
    isPrivate: boolean;
  }[];
};

interface ServiceEditorProps {
  initialService?: ServiceRow;
  isEdit?: boolean;
}

export function ServiceEditor({
  initialService,
  isEdit = false,
}: ServiceEditorProps) {
  const router = useRouter();
  
  const [form, setForm] = useState<ServiceRow>({
    name: "",
    description: "",
    durationMin: 60,
    priceCents: 10000,
    depositCents: 2500,
    active: true,
    sortOrder: 0,
    category: "facials",
    photos: [],
    slug: "",
    metaTitle: "",
    metaDescription: "",
    keywords: "",
  });
  
  const [priceDollars, setPriceDollars] = useState<string>("100");
  const [depositDollars, setDepositDollars] = useState<string>("25");
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [resultType, setResultType] = useState<"pre" | "post">("pre");
  const [resultPrivate, setResultPrivate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Mapped Products State
  const [mappedProducts, setMappedProducts] = useState<any[]>([]);
  const [genLoading, setGenLoading] = useState(false);

  const loadMappedProducts = async (serviceId: string) => {
    try {
      const res = await fetch(`/api/admin/products?serviceId=${serviceId}`);
      if (res.ok) {
        const data = await res.json();
        setMappedProducts(data.products || []);
      }
    } catch {
      // quiet catch
    }
  };

  useEffect(() => {
    if (isEdit && initialService?.id) {
      void loadMappedProducts(initialService.id);
    }
  }, [isEdit, initialService?.id]);

  const handleGenerateProductsForThisService = async () => {
    const sId = form.id || initialService?.id;
    if (!sId) return;
    setGenLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: sId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate products");
      await loadMappedProducts(sId);
    } catch (err: any) {
      setError(err.message || "Failed to generate products");
    } finally {
      setGenLoading(false);
    }
  };

  // Initialize form state when editing
  useEffect(() => {
    if (isEdit && initialService) {
      setForm({
        ...initialService,
        photos: initialService.photos || [],
      });
      setPriceDollars(String(initialService.priceCents / 100));
      setDepositDollars(String(initialService.depositCents / 100));
      if (initialService.images) {
        setUploadedImages(initialService.images);
      }
    }
  }, [isEdit, initialService]);

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "service" | "pre" | "post",
    isPrivate = false
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "service" && uploadedImages.filter((img) => img.type === "service").length >= 5) {
      setError("Maximum of 5 showcase photos allowed per service");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("serviceId", form.id || "");
      formData.append("type", type);
      formData.append("isPrivate", String(isPrivate));

      const res = await fetch("/api/services/images", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload file");

      const rawImg = data.serviceImage;
      const formattedImage = {
        id: String(rawImg._id || rawImg.id),
        url: String(rawImg.url),
        ipfsHash: String(rawImg.ipfsHash),
        type: String(rawImg.type),
        isPrivate: Boolean(rawImg.isPrivate),
      };

      const newImages = [...uploadedImages, formattedImage];
      setUploadedImages(newImages);

      // Auto-update photos array for showcase display backwards compatibility
      setForm((prev) => ({
        ...prev,
        photos: newImages.filter((img) => img.type === "service").map((img) => img.url),
      }));
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteImage(id: string) {
    if (!window.confirm("Are you sure you want to delete this image permanently from Pinata IPFS?")) {
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/services/images?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete image");

      const newImages = uploadedImages.filter((img) => img.id !== id);
      setUploadedImages(newImages);

      setForm((prev) => ({
        ...prev,
        photos: newImages.filter((img) => img.type === "service").map((img) => img.url),
      }));
    } catch (err: any) {
      setError(err.message || "Failed to delete image.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setLoading(true);
    setError("");

    const priceCents = Math.round(parseFloat(priceDollars) * 100);
    const depositCents = Math.round(parseFloat(depositDollars) * 100);

    if (isNaN(priceCents) || priceCents < 0) {
      setError("Please enter a valid Total Price (CAD)");
      setLoading(false);
      return;
    }
    if (isNaN(depositCents) || depositCents < 0) {
      setError("Please enter a valid Required Deposit (CAD)");
      setLoading(false);
      return;
    }

    const payload = {
      ...form,
      priceCents,
      depositCents,
    };

    try {
      const res = await fetch("/api/services", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? { id: initialService?.id, ...payload } : payload,
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      // Go back to the main list after saving
      router.push("/admin/services");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full text-left">
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-[family-name:var(--font-display)] text-[var(--ink)]">
            {isEdit ? "Modify Service Profile" : "Register New Service"}
          </h2>
          <Link
            href="/admin/services"
            className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 transition-colors"
          >
            ← Back to Services
          </Link>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
              Service Name
            </label>
            <input
              placeholder="e.g. Signature Custom Facial"
              style={{ backgroundColor: "var(--card-bg)" }}
              className="w-full border border-[var(--border-color)] px-3 py-2.5 text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Category Field */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              style={{ backgroundColor: "var(--card-bg)" }}
              className="w-full border border-[var(--border-color)] px-3 py-2.5 text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors cursor-pointer"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="facials" className="bg-[var(--card-bg)] text-[var(--ink)]">Facials</option>
              <option value="lashes" className="bg-[var(--card-bg)] text-[var(--ink)]">Lashes</option>
              <option value="permanentMakeUp" className="bg-[var(--card-bg)] text-[var(--ink)]">Permanent Make-Up (Brows)</option>
            </select>
          </div>

          {/* Duration Field */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
              Duration (minutes)
            </label>
            <input
              placeholder="e.g. 60"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              step="1"
              style={{ backgroundColor: "var(--card-bg)" }}
              className="w-full border border-[var(--border-color)] px-3 py-2.5 text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors"
              value={form.durationMin || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setForm({ ...form, durationMin: val ? Math.max(1, parseInt(val, 10)) : 0 });
              }}
            />
          </div>

          {/* Price Dollars Field */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
              Total Price (CAD)
            </label>
            <input
              placeholder="e.g. 120"
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              min="0"
              step="any"
              style={{ backgroundColor: "var(--card-bg)" }}
              className="w-full border border-[var(--border-color)] px-3 py-2.5 text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors"
              value={priceDollars}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                // Ensure max one decimal point
                const cleanVal = val.split(".").slice(0, 2).join(".");
                setPriceDollars(cleanVal);
              }}
            />
          </div>

          {/* Deposit Dollars Field */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
              Required Deposit (CAD)
            </label>
            <input
              placeholder="e.g. 25"
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              min="0"
              step="any"
              style={{ backgroundColor: "var(--card-bg)" }}
              className="w-full border border-[var(--border-color)] px-3 py-2.5 text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors"
              value={depositDollars}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                // Ensure max one decimal point
                const cleanVal = val.split(".").slice(0, 2).join(".");
                setDepositDollars(cleanVal);
              }}
            />
          </div>

          {/* Active Status Checkbox */}
          <div className="flex items-end pb-3">
            <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)] font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.active}
                className="w-5 h-5 rounded border-[var(--border-color)] text-[#2f5d4a] focus:ring-[#2f5d4a]"
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Available for Public Bookings
            </label>
          </div>

          {/* Description Textarea */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Describe service benefits, process, and client details..."
              style={{ backgroundColor: "var(--card-bg)" }}
              className="w-full border border-[var(--border-color)] px-3 py-2.5 text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors min-h-[90px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* SEO & SEARCH ENGINE OPTIMIZATION */}
          <div className="sm:col-span-2 border-t border-[var(--border-color)] pt-6 mt-2 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-2">
                <span>🔍 Search Engine Optimization (SEO) &amp; Social Previews</span>
              </h3>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                Customize how this treatment appears on Google Search, Maps, and social media link previews (iMessage, WhatsApp, Instagram).
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                  Custom SEO Title
                </label>
                <input
                  placeholder={`e.g. ${form.name || "Treatment"} | Mari Esthetics Edmonton`}
                  style={{ backgroundColor: "var(--card-bg)" }}
                  className="w-full border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors"
                  value={form.metaTitle || ""}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                  URL Slug
                </label>
                <input
                  placeholder={`e.g. ${form.name ? form.name.toLowerCase().replace(/\s+/g, "-") : "treatment-slug"}`}
                  style={{ backgroundColor: "var(--card-bg)" }}
                  className="w-full border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors font-mono"
                  value={form.slug || ""}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                  Meta Description (Google Snippet)
                </label>
                <textarea
                  placeholder="Brief 1-2 sentence summary for Google search results..."
                  style={{ backgroundColor: "var(--card-bg)" }}
                  className="w-full border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors min-h-[60px]"
                  value={form.metaDescription || ""}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                  Search Keywords (Comma Separated)
                </label>
                <input
                  placeholder="e.g. facial edmonton, skin treatment, dermaplaning, mari esthetics"
                  style={{ backgroundColor: "var(--card-bg)" }}
                  className="w-full border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors"
                  value={form.keywords || ""}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Showcase & Results Galleries */}
          <div className="sm:col-span-2 border-t border-[var(--border-color)] pt-6 mt-4">
            {!isEdit ? (
              <div className="border border-dashed border-[var(--border-color)] bg-black/5 dark:bg-black/25 p-8 rounded-2xl text-center space-y-2">
                <svg className="w-10 h-10 text-[var(--ink-soft)] mx-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-semibold text-[var(--ink)]">Photos and Client Result Galleries</p>
                <p className="text-xs text-[var(--ink-soft)] max-w-sm mx-auto">
                  Pinata IPFS uploads, file management, and client result logs will become active once you save this service profile details for the first time.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* 0. MAPPED PRODUCTS & PAYMENT VARIANTS */}
                <div className="space-y-4 border-b border-[var(--border-color)] pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-2">
                        <span>📦 Mapped Products &amp; Payment Variants</span>
                        <span className="bg-[#c8a86b]/15 text-[#c8a86b] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {mappedProducts.length} mapped
                        </span>
                      </h3>
                      <p className="text-xs text-[var(--ink-soft)] mt-1">
                        Products linked to this service (Full Payment, Deposit, Balance) for accounting &amp; transaction tracking.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={genLoading}
                        onClick={handleGenerateProductsForThisService}
                        className="px-3.5 py-1.5 rounded-xl border border-[#c8a86b]/40 bg-[#c8a86b]/10 text-[#c8a86b] text-xs font-semibold hover:bg-[#c8a86b]/20 transition-all cursor-pointer shadow-sm"
                      >
                        {genLoading ? "Generating..." : "⚡ Auto-Generate 3 Variants"}
                      </button>
                      <Link
                        href="/admin/products"
                        className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all font-medium"
                      >
                        Manage All Products →
                      </Link>
                    </div>
                  </div>

                  {mappedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      {mappedProducts.map((prod) => (
                        <div
                          key={prod._id}
                          className="border border-[var(--border-color)] bg-[var(--card-bg)] p-3.5 rounded-2xl space-y-1.5 text-left shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[#c8a86b] tracking-wider">
                              {prod.kind.replace("_", " ")}
                            </span>
                            <span className="text-xs font-bold text-[var(--ink)]">
                              {formatCad(prod.priceCents)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[var(--ink)] truncate">{prod.name}</p>
                          <p className="text-[10px] text-[var(--ink-soft)] line-clamp-1">
                            {prod.description || "Mapped product variant"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 border border-dashed border-[var(--border-color)] bg-black/5 dark:bg-white/[0.01] rounded-2xl text-center space-y-2">
                      <p className="text-xs text-[var(--ink-soft)] italic">
                        No mapped products found for this service yet.
                      </p>
                      <button
                        type="button"
                        disabled={genLoading}
                        onClick={handleGenerateProductsForThisService}
                        className="text-xs text-[#c8a86b] font-bold hover:underline cursor-pointer"
                      >
                        Click here to auto-generate Full Payment, Deposit, and Balance products →
                      </button>
                    </div>
                  )}
                </div>

                {/* 1. SHOWCASE IMAGES */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider">Service Showcase Gallery</h3>
                    <p className="text-xs text-[var(--ink-soft)] mt-1">Upload up to 5 photos to display on the public website service details slider.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <label className="flex items-center gap-2 bg-[#2f5d4a] hover:bg-[#3b725b] text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-200 shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Upload Showcase Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => void handleFileUpload(e, "service")}
                      />
                    </label>
                    {uploading && <span className="text-xs text-[#c8a86b] font-medium animate-pulse">Uploading file to Pinata IPFS...</span>}
                  </div>

                  {/* Thumbnail grid */}
                  <div className="flex flex-wrap gap-4 mt-3">
                    {uploadedImages
                      .filter((img) => img.type === "service")
                      .map((img) => (
                        <div key={img.id || img._id || img.ipfsHash} className="relative group w-24 h-24 border border-[var(--border-color)] bg-black/10 rounded-xl overflow-hidden shadow-sm">
                          <img src={img.url} alt="Showcase" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => void handleDeleteImage(img.id)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity duration-200 rounded-xl cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    {/* Placeholder slots */}
                    {Array.from({
                      length: Math.max(0, 5 - uploadedImages.filter((img) => img.type === "service").length),
                    }).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-24 h-24 border-2 border-dashed border-[var(--border-color)] rounded-xl flex items-center justify-center text-[var(--ink-soft)]/50 text-[10px] select-none font-medium"
                      >
                        Slot {uploadedImages.filter((img) => img.type === "service").length + idx + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. CLIENT RESULTS PORTFOLIO (PRE & POST) */}
                <div className="space-y-4 border-t border-[var(--border-color)] pt-6">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider">Client Results & Completion Log</h3>
                    <p className="text-xs text-[var(--ink-soft)] mt-1">
                      Upload pre-treatment and post-treatment results. You can mark these as private (for clinic records only) or public.
                    </p>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex flex-wrap gap-4 items-center bg-black/5 dark:bg-black/20 p-4 border border-[var(--border-color)] rounded-xl">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider">Type</span>
                      <select
                        style={{ backgroundColor: "var(--card-bg)" }}
                        className="border border-[var(--border-color)] px-3 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-lg transition-colors cursor-pointer"
                        value={resultType}
                        onChange={(e) => setResultType(e.target.value as "pre" | "post")}
                      >
                        <option value="pre">Pre-Treatment</option>
                        <option value="post">Post-Treatment</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider">Visibility</span>
                      <select
                        style={{ backgroundColor: "var(--card-bg)" }}
                        className="border border-[var(--border-color)] px-3 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-lg transition-colors cursor-pointer"
                        value={String(resultPrivate)}
                        onChange={(e) => setResultPrivate(e.target.value === "true")}
                      >
                        <option value="false">Public Portfolio</option>
                        <option value="true">Private Record</option>
                      </select>
                    </div>

                    <div className="flex items-end self-end">
                      <label className="flex items-center gap-2 bg-[#2f5d4a] hover:bg-[#3b725b] text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors duration-200">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Result Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => void handleFileUpload(e, resultType, resultPrivate)}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Results list */}
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {uploadedImages
                      .filter((img) => img.type === "pre" || img.type === "post")
                      .map((img) => (
                        <div
                          key={img.id || img._id || img.ipfsHash}
                          className="flex gap-3 p-3 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl items-center relative group"
                        >
                          <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-[var(--border-color)]">
                            <img src={img.url} alt="Result log" className="w-full h-full object-cover" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              img.type === "pre"
                                ? "border-amber-500/30 bg-amber-500/5 text-amber-500"
                                : "border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                            }`}>
                              {img.type === "pre" ? "Pre-Treatment" : "Post-Treatment"}
                            </span>
                            
                            <div className="text-[10px] text-[var(--ink-soft)] mt-1.5 font-semibold flex items-center gap-1">
                              {img.isPrivate ? (
                                <span className="text-red-400 font-bold">🔒 Private Record</span>
                              ) : (
                                <span className="text-green-500 font-bold">🌐 Public Gallery</span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => void handleDeleteImage(img.id)}
                            className="text-xs text-red-400 hover:text-red-500 font-semibold p-1 hover:bg-red-500/5 rounded cursor-pointer transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    {uploadedImages.filter((img) => img.type === "pre" || img.type === "post").length === 0 && (
                      <p className="text-xs text-[var(--ink-soft)] italic sm:col-span-3 py-6 text-center">
                        No client treatment results uploaded yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action controls */}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={loading || !form.name}
            className="bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:from-[#e2c78c] hover:to-[#c8a86b] text-[#24180a] hover:shadow-[0_0_15px_rgba(200,168,107,0.25)] font-semibold text-sm py-2.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
            onClick={() => void save()}
          >
            {isEdit ? "Save Profile Adjustments" : "Register Service"}
          </button>
          
          <Link
            href="/admin/services"
            className="border border-[var(--border-color)] hover:border-red-500 hover:text-red-500 hover:bg-red-500/5 text-xs text-[var(--ink-soft)] transition-all duration-200 cursor-pointer rounded-xl px-4 py-2.5 font-medium flex items-center justify-center"
          >
            Cancel
          </Link>
        </div>
        
        {error && <p className="mt-3 text-sm text-red-400 font-semibold">{error}</p>}
      </div>
    </div>
  );
}
