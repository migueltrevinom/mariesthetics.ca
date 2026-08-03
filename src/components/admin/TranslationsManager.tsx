"use client";

import { useState } from "react";
import en from "@/messages/en.json";
import tl from "@/messages/tl.json";
import pa from "@/messages/pa.json";
import ar from "@/messages/ar.json";
import es from "@/messages/es.json";

export interface TranslationItem {
  _id?: string;
  page: string;
  key: string;
  translations: {
    en?: string;
    tl?: string;
    pa?: string;
    ar?: string;
    es?: string;
  };
  updatedBy?: string;
  updatedAt?: string;
}

const PAGES = [
  { value: "all", label: "All Pages" },
  { value: "hero", label: "Hero Banner" },
  { value: "services", label: "Services Page" },
  { value: "footer", label: "Footer" },
  { value: "booking", label: "Booking Calendar" },
  { value: "contact", label: "Contact & Hours" },
  { value: "membership", label: "Memberships" },
  { value: "general", label: "General & UI" },
];

const LOCALES = [
  { code: "en", label: "English", flag: "🇨🇦", keyName: "en" },
  { code: "tl", label: "Tagalog", flag: "🇵🇭", keyName: "tl" },
  { code: "pa", label: "ਪੰਜਾਬੀ", flag: "🇮🇳", keyName: "pa" },
  { code: "ar", label: "العربية", flag: "🇸🇦", keyName: "ar", dir: "rtl" },
  { code: "es", label: "Español", flag: "🇲🇽", keyName: "es" },
];

export function TranslationsManager({
  initialTranslations = [],
}: {
  initialTranslations?: TranslationItem[];
}) {
  const [translations, setTranslations] = useState<TranslationItem[]>(initialTranslations);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Filters & Search
  const [selectedPage, setSelectedPage] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Side Drawer & Diff Review States
  const [showDrawer, setShowDrawer] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TranslationItem | null>(null);

  const [editPage, setEditPage] = useState("general");
  const [editKey, setEditKey] = useState("");
  const [editTranslations, setEditTranslations] = useState<{
    en: string;
    tl: string;
    pa: string;
    ar: string;
    es: string;
  }>({ en: "", tl: "", pa: "", ar: "", es: "" });

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/translations");
      if (res.ok) {
        const data = await res.json();
        setTranslations(data.translations || []);
      }
    } catch {
      setError("Failed to reload translations.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingItem(null);
    setEditPage(selectedPage === "all" ? "general" : selectedPage);
    setEditKey("");
    setEditTranslations({ en: "", tl: "", pa: "", ar: "", es: "" });
    setError("");
    setMessage("");
    setShowDrawer(true);
  };

  const handleEdit = (item: TranslationItem) => {
    setEditingItem(item);
    setEditPage(item.page);
    setEditKey(item.key);
    setEditTranslations({
      en: item.translations?.en || "",
      tl: item.translations?.tl || "",
      pa: item.translations?.pa || "",
      ar: item.translations?.ar || "",
      es: item.translations?.es || "",
    });
    setError("");
    setMessage("");
    setShowDrawer(true);
  };

  const handleProceedToDiff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPage.trim() || !editKey.trim()) {
      setError("Page category and Key are required.");
      return;
    }
    setError("");
    setShowDiffModal(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: editPage,
          key: editKey,
          translations: editTranslations,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save copy translation");

      setMessage(`Successfully updated translation key "${editKey}"!`);
      setShowDiffModal(false);
      setShowDrawer(false);
      setEditingItem(null);
      void fetchTranslations();
    } catch (err: any) {
      setError(err.message || "Failed to save translation");
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm("This will seed all static JSON translation keys into MongoDB. Continue?")) return;
    setSeeding(true);
    setError("");
    setMessage("");

    try {
      const dicts: Record<string, any> = { en, tl, pa, ar, es };
      const itemsMap: Record<string, { page: string; key: string; translations: Record<string, string> }> = {};

      const extractKeys = (obj: any, prefix = "") => {
        for (const k in obj) {
          const fullKey = prefix ? `${prefix}.${k}` : k;
          if (typeof obj[k] === "string") {
            const page = fullKey.split(".")[0] || "general";
            if (!itemsMap[fullKey]) {
              itemsMap[fullKey] = { page, key: fullKey, translations: { en: "", tl: "", pa: "", ar: "", es: "" } };
            }
          } else if (typeof obj[k] === "object" && obj[k] !== null) {
            extractKeys(obj[k], fullKey);
          }
        }
      };

      extractKeys(en);

      for (const lang of ["en", "tl", "pa", "ar", "es"]) {
        const dict = dicts[lang];
        if (!dict) continue;
        const fillVals = (obj: any, prefix = "") => {
          for (const k in obj) {
            const fullKey = prefix ? `${prefix}.${k}` : k;
            if (typeof obj[k] === "string" && itemsMap[fullKey]) {
              itemsMap[fullKey].translations[lang] = obj[k];
            } else if (typeof obj[k] === "object" && obj[k] !== null) {
              fillVals(obj[k], fullKey);
            }
          }
        };
        fillVals(dict);
      }

      const items = Object.values(itemsMap);

      const res = await fetch("/api/admin/translations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to seed translations");

      setMessage(`Successfully seeded ${data.count} translation keys into database!`);
      void fetchTranslations();
    } catch (err: any) {
      setError(err.message || "Failed to seed defaults");
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id: string, keyName: string) => {
    if (!confirm(`Are you sure you want to delete translation key "${keyName}"?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/translations?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete translation");
      setMessage(`Deleted key "${keyName}"`);
      void fetchTranslations();
    } catch (err: any) {
      setError(err.message || "Failed to delete translation");
    } finally {
      setSaving(false);
    }
  };

  // Filtered translations list
  const filteredTranslations = translations.filter((item) => {
    const matchesPage = selectedPage === "all" || item.page.toLowerCase() === selectedPage.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesPage;

    const matchesKey = item.key.toLowerCase().includes(q);
    const matchesEn = (item.translations?.en || "").toLowerCase().includes(q);
    const matchesTl = (item.translations?.tl || "").toLowerCase().includes(q);
    const matchesPa = (item.translations?.pa || "").toLowerCase().includes(q);
    const matchesAr = (item.translations?.ar || "").toLowerCase().includes(q);
    const matchesEs = (item.translations?.es || "").toLowerCase().includes(q);

    return matchesPage && (matchesKey || matchesEn || matchesTl || matchesPa || matchesAr || matchesEs);
  });

  return (
    <div className="space-y-8 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-[var(--ink)]">
            Multi-Language Copies &amp; Translations
          </h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Manage UI copy across English, Tagalog, Punjabi, Arabic, and Spanish. Updates reflect immediately on your live site.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="btn-ghost text-xs px-4 py-2.5 border border-[#c8a86b]/40 text-[#c8a86b] hover:bg-[#c8a86b]/10 rounded-xl font-semibold transition-all"
          >
            {seeding ? "Seeding..." : "⚡ Seed Default JSON Copies"}
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className="btn-primary inline-flex items-center gap-2 text-xs px-5 py-2.5 shadow-md"
          >
            <span>＋ Add Copy Key</span>
          </button>
        </div>
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

      {/* Slide-Over Side Drawer Backdrop & Container */}
      {showDrawer && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setShowDrawer(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[540px] md:w-[620px] bg-[var(--card-bg)] text-[var(--ink)] shadow-2xl z-50 border-l border-[var(--border-color)] flex flex-col h-full overflow-hidden transition-transform animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-black/5 dark:bg-black/20 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-[family-name:var(--font-display)] text-[var(--ink)]">
                    {editingItem ? "Edit Translation Key" : "New Translation Key"}
                  </h2>
                  {editKey && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#c8a86b]/15 text-[#c8a86b]">
                      {editKey}
                    </span>
                  )}
                </div>
                {editingItem?.updatedBy && (
                  <p className="text-[11px] text-[var(--ink-soft)] mt-1">
                    👤 Last edited by: <strong className="text-[var(--ink)]">{editingItem.updatedBy}</strong>
                    {editingItem.updatedAt && (
                      <span className="ml-1 opacity-75">
                        · {new Date(editingItem.updatedAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] rounded-xl w-8 h-8 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <form id="translation-drawer-form" onSubmit={handleProceedToDiff} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                    Page Section Category
                  </label>
                  <select
                    style={{ backgroundColor: "var(--card-bg)" }}
                    className="w-full border border-[var(--border-color)] px-4 py-2.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors cursor-pointer"
                    value={editPage}
                    onChange={(e) => setEditPage(e.target.value)}
                  >
                    {PAGES.filter(p => p.value !== "all").map(p => (
                      <option key={p.value} value={p.value} className="bg-[var(--card-bg)] text-[var(--ink)]">
                        {p.label} ({p.value})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                    Translation Key Name
                  </label>
                  <input
                    placeholder="e.g. hero.title1 or booking.selectDate"
                    style={{ backgroundColor: "var(--card-bg)" }}
                    className="w-full border border-[var(--border-color)] px-4 py-2.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl font-mono transition-colors"
                    value={editKey}
                    onChange={(e) => setEditKey(e.target.value)}
                  />
                </div>
              </div>

              {/* 5 Language Inputs */}
              <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                    Copy Translations (5 Languages)
                  </h3>
                  <span className="text-[10px] text-[var(--ink-soft)]">
                    English acts as default fallback
                  </span>
                </div>

                <div className="space-y-4">
                  {LOCALES.map((l) => {
                    const val = (editTranslations as any)[l.code] || "";
                    return (
                      <div key={l.code} className="space-y-1.5 bg-black/5 dark:bg-black/20 p-3.5 rounded-2xl border border-[var(--border-color)]">
                        <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink)]">
                          <span className="flex items-center gap-2">
                            <span>{l.flag}</span>
                            <span>{l.label} ({l.code})</span>
                          </span>
                          <span className="text-[10px] text-[var(--ink-soft)] font-mono">
                            {val.length} chars
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          dir={l.dir || "ltr"}
                          placeholder={`Enter copy text in ${l.label}...`}
                          style={{ backgroundColor: "var(--card-bg)" }}
                          className="w-full border border-[var(--border-color)] px-3.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl transition-colors font-sans leading-relaxed"
                          value={val}
                          onChange={(e) =>
                            setEditTranslations({
                              ...editTranslations,
                              [l.code]: e.target.value,
                            })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[var(--border-color)] bg-black/5 dark:bg-black/20 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="btn-ghost text-xs px-4 py-2.5"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="translation-drawer-form"
                className="btn-primary text-xs px-6 py-2.5 shadow-lg flex items-center gap-2"
              >
                <span>Review &amp; Compare Changes</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Before vs After Diff Review Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[var(--card-bg)] text-[var(--ink)] border border-[#c8a86b]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--border-color)] bg-black/5 dark:bg-black/30 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--ink)]">
                    🔍 Review Copy Changes (Before vs. After)
                  </h3>
                </div>
                <p className="text-xs text-[var(--ink-soft)] mt-1">
                  Key: <code className="text-[#c8a86b] font-bold">{editKey}</code> · Category: <strong>{editPage}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                Confirm your proposed text edits below. Compare what was previously saved in database vs. your new copy.
              </p>

              <div className="space-y-4">
                {LOCALES.map((l) => {
                  const originalVal = (editingItem?.translations as any)?.[l.code] || "";
                  const newVal = (editTranslations as any)[l.code] || "";
                  const isChanged = originalVal !== newVal;

                  return (
                    <div key={l.code} className="border border-[var(--border-color)] rounded-2xl p-4 space-y-2 bg-black/5 dark:bg-black/20">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isChanged
                            ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                            : "bg-black/10 dark:bg-white/10 text-[var(--ink-soft)]"
                        }`}>
                          {isChanged ? "Modified" : "Unchanged"}
                        </span>
                      </div>

                      {isChanged ? (
                        <div className="space-y-2 pt-1">
                          {/* Before */}
                          <div className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs">
                            <span className="text-[10px] uppercase font-bold text-rose-500 block mb-0.5">
                              - BEFORE (Current DB):
                            </span>
                            <p dir={l.dir || "ltr"} className="font-sans">
                              {originalVal || <span className="italic opacity-60">(Empty)</span>}
                            </p>
                          </div>

                          {/* After */}
                          <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs">
                            <span className="text-[10px] uppercase font-bold text-emerald-500 block mb-0.5">
                              + AFTER (Proposed New Copy):
                            </span>
                            <p dir={l.dir || "ltr"} className="font-sans font-medium">
                              {newVal || <span className="italic opacity-60">(Empty)</span>}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-black/30 text-xs text-[var(--ink-soft)] font-sans">
                          {newVal || <span className="italic opacity-50">(Empty)</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border-color)] bg-black/5 dark:bg-black/30 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="btn-ghost text-xs px-4 py-2.5"
              >
                ✏️ Back to Editing
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving}
                className="btn-primary text-xs px-6 py-2.5 shadow-lg font-bold"
              >
                {saving ? "Saving Changes..." : "✓ Confirm & Save to Database"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--border-color)] bg-[var(--card-bg)] p-4 rounded-2xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {PAGES.map((page) => {
              const active = selectedPage === page.value;
              return (
                <button
                  key={page.value}
                  type="button"
                  onClick={() => setSelectedPage(page.value)}
                  className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
                    active
                      ? "bg-[#c8a86b] text-black shadow-sm"
                      : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {page.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              placeholder="Search keys or text..."
              style={{ backgroundColor: "var(--card-bg)" }}
              className="w-full border border-[var(--border-color)] px-4 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] rounded-xl pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-xs text-[var(--ink-soft)] select-none">🔍</span>
          </div>
        </div>

        {/* Translation Cards List */}
        {loading ? (
          <div className="text-center py-12 text-xs text-[var(--ink-soft)] animate-pulse border border-[var(--border-color)] rounded-2xl">
            Loading translation keys...
          </div>
        ) : filteredTranslations.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[var(--border-color)] bg-[var(--card-bg)] rounded-3xl space-y-3">
            <div className="text-3xl">🌐</div>
            <p className="text-sm font-semibold text-[var(--ink)]">No translation keys found</p>
            <p className="text-xs text-[var(--ink-soft)] max-w-sm mx-auto">
              Click <strong>⚡ Seed Default JSON Copies</strong> above to auto-populate MongoDB with all current site copies!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTranslations.map((item) => (
              <div
                key={item._id || item.key}
                className="border border-[var(--border-color)] bg-[var(--card-bg)] p-5 rounded-2xl space-y-4 shadow-sm hover:border-[#c8a86b]/40 transition-all text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#c8a86b]/15 text-[#c8a86b] border border-[#c8a86b]/30">
                        {item.key}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[var(--ink-soft)] tracking-wider">
                        Page: {item.page}
                      </span>
                    </div>

                    {item.updatedBy && (
                      <p className="text-[11px] text-[var(--ink-soft)] mt-1.5">
                        👤 Last edited by: <strong className="text-[var(--ink)]">{item.updatedBy}</strong>
                        {item.updatedAt && (
                          <span className="ml-1 opacity-75">
                            · {new Date(item.updatedAt).toLocaleString()}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] rounded-xl px-4 py-2 transition-colors font-semibold flex items-center gap-1.5"
                    >
                      <span>✏️ Edit Copy</span>
                    </button>
                    {item._id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id!, item.key)}
                        className="text-xs text-rose-500 hover:text-rose-600 border border-rose-500/20 rounded-xl px-3.5 py-2 transition-colors font-semibold"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {LOCALES.map((l) => {
                    const textVal = (item.translations as any)?.[l.code] || "";
                    return (
                      <div
                        key={l.code}
                        className="p-3 rounded-xl bg-black/5 dark:bg-black/30 border border-[var(--border-color)] space-y-1"
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[var(--ink-soft)] tracking-wider">
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                        </div>
                        <p
                          dir={l.dir || "ltr"}
                          className="text-xs text-[var(--ink)] leading-relaxed font-sans line-clamp-2"
                        >
                          {textVal || <span className="italic text-[var(--ink-soft)]/60">No translation</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
