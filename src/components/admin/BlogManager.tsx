"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";

const LANGUAGES = [
  { code: "all", label: "All Languages", flag: "🌐" },
  { code: "en", label: "English", flag: "🇨🇦" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "tl", label: "Tagalog", flag: "🇵🇭" },
  { code: "pa", label: "Punjabi", flag: "🇮🇳" },
  { code: "ar", label: "Arabic", flag: "🇦🇪" },
];

export interface BlogPostItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  language: string;
  serviceIds?: Array<{ _id: string; name: string; slug: string } | string>;
  category?: string;
  status: "draft" | "published" | "archived";
  publishedAt?: string | null;
  viewsCount: number;
  metaTitle?: string;
  metaDescription?: string;
  author?: string;
  promoConfig?: {
    enabled: boolean;
    promoCode?: string;
    customPromoText?: string;
    ctaButtonText?: string;
    ctaUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SubscriberItem {
  _id: string;
  email: string;
  name?: string;
  language: string;
  status: "active" | "unsubscribed";
  source: string;
  subscribedAt: string;
}

export interface ServiceOption {
  _id: string;
  name: string;
  slug?: string;
  priceCents: number;
}

export function BlogManager({
  initialPosts = [],
  initialServices = [],
  initialSubscribers = [],
  initialStats,
}: {
  initialPosts?: BlogPostItem[];
  initialServices?: ServiceOption[];
  initialSubscribers?: SubscriberItem[];
  initialStats?: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
  };
}) {
  const [posts, setPosts] = useState<BlogPostItem[]>(initialPosts);
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>(initialSubscribers);
  const [stats, setStats] = useState(
    initialStats || {
      totalPosts: initialPosts.length,
      publishedPosts: initialPosts.filter((p) => p.status === "published").length,
      draftPosts: initialPosts.filter((p) => p.status === "draft").length,
      totalViews: initialPosts.reduce((acc, p) => acc + (p.viewsCount || 0), 0),
    }
  );

  // Filter State
  const [selectedLang, setSelectedLang] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeTab, setActiveTab] = useState<"posts" | "subscribers">("posts");

  // Loading & Alert State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Editor Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostItem | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Editor Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formLanguage, setFormLanguage] = useState("en");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formServiceIds, setFormServiceIds] = useState<string[]>([]);
  const [formCategory, setFormCategory] = useState("");
  const [formStatus, setFormStatus] = useState<"draft" | "published">("published");
  const [formMetaTitle, setFormMetaTitle] = useState("");
  const [formMetaDesc, setFormMetaDesc] = useState("");
  const [formPromoEnabled, setFormPromoEnabled] = useState(false);
  const [formPromoCode, setFormPromoCode] = useState("");
  const [formPromoText, setFormPromoText] = useState("");
  const [formCtaText, setFormCtaText] = useState("Book Treatment Now →");
  const [formCtaUrl, setFormCtaUrl] = useState("/book");

  // Newsletter Dispatch Modal State
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false);
  const [targetPostForNewsletter, setTargetPostForNewsletter] = useState<BlogPostItem | null>(null);
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [newsletterTargetLang, setNewsletterTargetLang] = useState("all");
  const [dispatchingNewsletter, setDispatchingNewsletter] = useState(false);

  const showNotification = (message: string) => {
    setMsg(message);
    setTimeout(() => setMsg(""), 4000);
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/blogs");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        if (data.stats) setStats(data.stats);
      }
      const subRes = await fetch("/api/admin/subscribers");
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscribers(subData.subscribers || []);
      }
    } catch {
      setErr("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPost(null);
    setFormTitle("");
    setFormSlug("");
    setFormLanguage("en");
    setFormExcerpt("");
    setFormContent(
      `## The Secret to Long-Lasting Glow\n\nTailored skincare treatments designed specifically for Edmonton's dry seasonal climate.\n\n### Why Hydration Matters\n- Restores deep skin barrier moisture\n- Smooths texture and refines pores\n- Promotes a natural radiant complexion\n\n> "Consistency and bespoke care are the foundation of true glass skin."\n\nBook your private one-on-one session at our West Edmonton studio to experience bespoke beauty.`
    );
    setFormCoverImage("https://cdn.verifik.co/mariesthetics/services/hydra-facial.jpg");
    setFormServiceIds([]);
    setFormCategory("facials");
    setFormStatus("published");
    setFormMetaTitle("");
    setFormMetaDesc("");
    setFormPromoEnabled(true);
    setFormPromoCode("GLOW20");
    setFormPromoText("Enjoy $20 off your first tailored facial session at Mari Esthetics.");
    setFormCtaText("Book Your Session Now →");
    setFormCtaUrl("/book");
    setPreviewMode(false);
    setEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (post: BlogPostItem) => {
    setEditingPost(post);
    setFormTitle(post.title);
    setFormSlug(post.slug);
    setFormLanguage(post.language || "en");
    setFormExcerpt(post.excerpt || "");
    setFormContent(post.content || "");
    setFormCoverImage(post.coverImage || "");
    const sIds = (post.serviceIds || []).map((s: any) => (typeof s === "string" ? s : s._id));
    setFormServiceIds(sIds);
    setFormCategory(post.category || "");
    setFormStatus(post.status === "published" ? "published" : "draft");
    setFormMetaTitle(post.metaTitle || "");
    setFormMetaDesc(post.metaDescription || "");
    setFormPromoEnabled(post.promoConfig?.enabled || false);
    setFormPromoCode(post.promoConfig?.promoCode || "");
    setFormPromoText(post.promoConfig?.customPromoText || "");
    setFormCtaText(post.promoConfig?.ctaButtonText || "Book Treatment Now →");
    setFormCtaUrl(post.promoConfig?.ctaUrl || "/book");
    setPreviewMode(false);
    setEditorOpen(true);
  };

  // Save Blog Post
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setErr("Post title is required");
      return;
    }
    if (!formContent.trim()) {
      setErr("Post content is required");
      return;
    }

    setSaving(true);
    setErr("");

    const payload = {
      title: formTitle.trim(),
      slug: formSlug.trim() || undefined,
      language: formLanguage,
      excerpt: formExcerpt.trim(),
      content: formContent,
      coverImage: formCoverImage.trim(),
      serviceIds: formServiceIds,
      category: formCategory.trim(),
      status: formStatus,
      metaTitle: formMetaTitle.trim(),
      metaDescription: formMetaDesc.trim(),
      promoConfig: {
        enabled: formPromoEnabled,
        promoCode: formPromoCode.trim().toUpperCase(),
        customPromoText: formPromoText.trim(),
        ctaButtonText: formCtaText.trim() || "Book Treatment Now →",
        ctaUrl: formCtaUrl.trim() || "/book",
      },
    };

    try {
      const url = editingPost ? `/api/admin/blogs/${editingPost._id}` : "/api/admin/blogs";
      const method = editingPost ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save blog post");
      }

      showNotification(editingPost ? "Blog post updated successfully!" : "New blog post created!");
      setEditorOpen(false);
      await refreshData();
    } catch (error: any) {
      setErr(error.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
      showNotification(`"${title}" deleted successfully.`);
      await refreshData();
    } catch (error: any) {
      alert(error.message || "Failed to delete post");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (post: BlogPostItem) => {
    const nextStatus = post.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/blogs/${post._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update status");
      showNotification(`Post set to ${nextStatus}.`);
      await refreshData();
    } catch (error: any) {
      alert(error.message || "Failed to update status");
    }
  };

  // Open Newsletter Modal
  const handleOpenNewsletterModal = (post: BlogPostItem) => {
    setTargetPostForNewsletter(post);
    setNewsletterSubject(`✨ New from Mari Esthetics: ${post.title}`);
    setNewsletterTargetLang(post.language || "all");
    setNewsletterModalOpen(true);
  };

  // Send Newsletter
  const handleSendNewsletter = async () => {
    if (!targetPostForNewsletter) return;
    if (!newsletterSubject.trim()) {
      alert("Please enter a subject line for the newsletter");
      return;
    }

    setDispatchingNewsletter(true);
    try {
      const res = await fetch(`/api/admin/blogs/${targetPostForNewsletter._id}/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newsletterSubject.trim(),
          targetLanguage: newsletterTargetLang,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to dispatch newsletter");
      showNotification(data.message || "Newsletter successfully sent!");
      setNewsletterModalOpen(false);
    } catch (error: any) {
      alert(error.message || "Failed to send newsletter");
    } finally {
      setDispatchingNewsletter(false);
    }
  };

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      // Language filter
      if (selectedLang !== "all" && p.language !== selectedLang) return false;
      // Status filter
      if (selectedStatus !== "all" && p.status !== selectedStatus) return false;
      // Service filter
      if (selectedService !== "all") {
        const sIds = (p.serviceIds || []).map((s: any) => (typeof s === "string" ? s : s._id));
        if (!sIds.includes(selectedService)) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchSlug = p.slug.toLowerCase().includes(q);
        const matchExcerpt = (p.excerpt || "").toLowerCase().includes(q);
        if (!matchTitle && !matchSlug && !matchExcerpt) return false;
      }
      return true;
    });
  }, [posts, selectedLang, selectedStatus, selectedService, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {msg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#24180a] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-leaf">✓</span>
          <span className="text-xs font-semibold">{msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✍️</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] font-[family-name:var(--font-display)]">
              Studio Blog &amp; Newsletter
            </h1>
          </div>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Publish skincare articles, track article clicks, and dispatch email campaigns with booking promos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refreshData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] hover:bg-white/[0.04] text-xs font-semibold text-[var(--ink)] transition cursor-pointer"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-primary text-xs !py-2.5 !px-5 shadow-lg flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <span>+</span>
            <span>Write New Post</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
          <span className="text-[11px] font-medium text-[var(--ink-soft)] uppercase tracking-wider block">
            Total Articles
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[var(--ink)] font-mono mt-1 block">
            {stats.totalPosts}
          </span>
          <span className="text-[10px] text-[var(--ink-soft)] mt-0.5 block">
            {stats.publishedPosts} published · {stats.draftPosts} drafts
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
          <span className="text-[11px] font-medium text-[var(--ink-soft)] uppercase tracking-wider block">
            Total Reader Clicks
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#c8a86b] font-mono mt-1 block">
            {stats.totalViews}
          </span>
          <span className="text-[10px] text-[var(--ink-soft)] mt-0.5 block">Article reads &amp; engagement</span>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
          <span className="text-[11px] font-medium text-[var(--ink-soft)] uppercase tracking-wider block">
            Newsletter Subscribers
          </span>
          <span className="text-2xl sm:text-3xl font-black text-leaf font-mono mt-1 block">
            {subscribers.filter((s) => s.status === "active").length}
          </span>
          <span className="text-[10px] text-[var(--ink-soft)] mt-0.5 block">Active email recipients</span>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
          <span className="text-[11px] font-medium text-[var(--ink-soft)] uppercase tracking-wider block">
            Publishing Languages
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[var(--ink)] font-mono mt-1 block">5</span>
          <span className="text-[10px] text-[var(--ink-soft)] mt-0.5 block">EN · ES · TL · PA · AR</span>
        </div>
      </div>

      {/* Main View Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "posts"
              ? "bg-[#24180a] text-white dark:bg-white dark:text-black shadow-sm"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-white/[0.04]"
          }`}
        >
          📰 Blog Posts ({filteredPosts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("subscribers")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "subscribers"
              ? "bg-[#24180a] text-white dark:bg-white dark:text-black shadow-sm"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-white/[0.04]"
          }`}
        >
          💌 Newsletter Subscribers ({subscribers.length})
        </button>
      </div>

      {/* ── TAB 1: BLOG POSTS ── */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] flex flex-wrap items-center justify-between gap-3">
            {/* Language Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setSelectedLang(l.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    selectedLang === l.code
                      ? "bg-[#c8a86b] text-black font-bold shadow-sm"
                      : "bg-[var(--background)] text-[var(--ink-soft)] border border-[var(--border-color)] hover:text-[var(--ink)]"
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>

            {/* Service & Search Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <select
                aria-label="Filter by service"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              >
                <option value="all">All Linked Services</option>
                {initialServices.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Only</option>
                <option value="draft">Drafts Only</option>
              </select>

              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                />
                <span className="absolute left-2.5 top-1.5 text-xs text-[var(--ink-soft)]">🔍</span>
              </div>
            </div>
          </div>

          {/* Posts List / Table */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--card-bg)] space-y-3">
              <span className="text-4xl block">📝</span>
              <h3 className="text-base font-bold text-[var(--ink)]">No blog posts found</h3>
              <p className="text-xs text-[var(--ink-soft)] max-w-sm mx-auto">
                No articles match your current language or search filters. Click below to write your first post.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="btn-primary text-xs !py-2.5 !px-6 cursor-pointer font-bold"
              >
                + Create Blog Post
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[var(--border-color)] rounded-2xl bg-[var(--card-bg)] shadow-sm">
              <table className="w-full text-left text-xs text-[var(--ink)] divide-y divide-[var(--border-color)]">
                <thead className="bg-[var(--background)] uppercase text-[10px] tracking-wider text-[var(--ink-soft)] font-bold">
                  <tr>
                    <th className="p-3.5">Post / Title</th>
                    <th className="p-3.5">Language</th>
                    <th className="p-3.5">Linked Services</th>
                    <th className="p-3.5 text-center">Clicks / Views</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Promo Offer</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredPosts.map((post) => {
                    const langInfo = LANGUAGES.find((l) => l.code === post.language);

                    return (
                      <tr key={post._id} className="hover:bg-white/[0.02] transition">
                        {/* Title & Cover */}
                        <td className="p-3.5 max-w-md">
                          <div className="flex items-center gap-3">
                            {post.coverImage ? (
                              <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-12 h-12 rounded-xl object-cover border border-[var(--border-color)] shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center text-lg shrink-0">
                                📄
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-sm text-[var(--ink)] block truncate">
                                {post.title}
                              </span>
                              <span className="text-[10px] text-[var(--ink-soft)] font-mono block truncate">
                                /blog/{post.slug}
                              </span>
                              {post.publishedAt && (
                                <span className="text-[9px] text-[var(--ink-soft)] mt-0.5 block">
                                  Published {format(new Date(post.publishedAt), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Language */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--background)] border border-[var(--border-color)]">
                            <span>{langInfo?.flag || "🌐"}</span>
                            <span>{langInfo?.label || post.language}</span>
                          </span>
                        </td>

                        {/* Linked Services */}
                        <td className="p-3.5">
                          {post.serviceIds && post.serviceIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {post.serviceIds.map((s: any) => (
                                <span
                                  key={typeof s === "string" ? s : s._id}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#c8a86b]/15 text-[var(--ink)] border border-[#c8a86b]/30"
                                >
                                  {typeof s === "string" ? "Service" : s.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[var(--ink-soft)]">—</span>
                          )}
                        </td>

                        {/* Views / Clicks */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-[#c8a86b] bg-[#c8a86b]/10 px-2.5 py-1 rounded-full">
                            <span>👁️</span>
                            <span>{post.viewsCount || 0}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(post)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition ${
                              post.status === "published"
                                ? "bg-leaf/15 text-leaf border border-leaf/30 hover:bg-leaf/25"
                                : "bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25"
                            }`}
                          >
                            {post.status === "published" ? "✓ Published" : "⏳ Draft"}
                          </button>
                        </td>

                        {/* Promo Offer */}
                        <td className="p-3.5 whitespace-nowrap">
                          {post.promoConfig?.enabled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-leaf font-semibold">
                              <span>🎁</span>
                              <span>{post.promoConfig.promoCode || "Offer Active"}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-[var(--ink-soft)]">None</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenNewsletterModal(post)}
                            title="Dispatch email newsletter to subscribers"
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--background)] hover:bg-[#c8a86b]/15 text-[var(--ink)] border border-[var(--border-color)] transition cursor-pointer"
                          >
                            💌 Newsletter
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(post)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--background)] hover:bg-white/[0.06] text-[var(--ink)] border border-[var(--border-color)] transition cursor-pointer"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePost(post._id, post.title)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: NEWSLETTER SUBSCRIBERS ── */}
      {activeTab === "subscribers" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--ink)]">Client Subscribers List</h3>
              <p className="text-xs text-[var(--ink-soft)]">
                Clients who opted into receiving beauty tips, blog posts, and exclusive studio discounts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-[var(--border-color)] rounded-2xl bg-[var(--card-bg)] shadow-sm">
            <table className="w-full text-left text-xs text-[var(--ink)] divide-y divide-[var(--border-color)]">
              <thead className="bg-[var(--background)] uppercase text-[10px] tracking-wider text-[var(--ink-soft)] font-bold">
                <tr>
                  <th className="p-3.5">Subscriber Email</th>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Preferred Language</th>
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5">Subscribed Date</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {subscribers.map((sub) => (
                  <tr key={sub._id} className="hover:bg-white/[0.02] transition">
                    <td className="p-3.5 font-bold font-mono text-[var(--ink)]">{sub.email}</td>
                    <td className="p-3.5 text-[var(--ink-soft)]">{sub.name || "—"}</td>
                    <td className="p-3.5 uppercase font-semibold text-[10px]">{sub.language}</td>
                    <td className="p-3.5 text-[10px] text-[var(--ink-soft)] uppercase">{sub.source}</td>
                    <td className="p-3.5 text-[var(--ink-soft)]">
                      {format(new Date(sub.subscribedAt), "MMM d, yyyy")}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === "active"
                            ? "bg-leaf/15 text-leaf border border-leaf/30"
                            : "bg-red-500/15 text-red-500 border border-red-500/30"
                        }`}
                      >
                        {sub.status === "active" ? "Active" : "Unsubscribed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GHOST-STYLE RICH POST EDITOR MODAL ── */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--background)] shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">✍️</span>
                <div>
                  <h3 className="text-base font-bold text-[var(--ink)]">
                    {editingPost ? `Edit: ${editingPost.title}` : "Write New Blog Article"}
                  </h3>
                  <span className="text-[11px] text-[var(--ink-soft)]">
                    Ghost-style Markdown &amp; Rich Content Publishing
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    previewMode
                      ? "bg-[#c8a86b] text-black border-[#c8a86b] font-bold"
                      : "border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--ink)] hover:bg-white/[0.04]"
                  }`}
                >
                  {previewMode ? "✏️ Edit Mode" : "👁️ Live Preview"}
                </button>

                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="w-8 h-8 rounded-full border border-[var(--border-color)] hover:bg-white/10 flex items-center justify-center text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSavePost} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
              {err && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-xs font-semibold">
                  ⚠️ {err}
                </div>
              )}

              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="font-bold text-[var(--ink)] uppercase tracking-wider text-[10px]">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 Signs Your Skin Barrier Needs a Deep Facial"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-sm font-bold text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--ink)] uppercase tracking-wider text-[10px]">
                    Language
                  </label>
                  <select
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-xs font-semibold text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  >
                    {LANGUAGES.filter((l) => l.code !== "all").map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Slug & Cover Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--ink-soft)] uppercase tracking-wider text-[10px]">
                    Custom URL Slug (auto-generated if empty)
                  </label>
                  <div className="flex items-center border border-[var(--border-color)] bg-[var(--background)] rounded-xl px-3 py-2">
                    <span className="text-[11px] text-[var(--ink-soft)] font-mono">/blog/</span>
                    <input
                      type="text"
                      placeholder="custom-article-slug"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      className="w-full bg-transparent text-xs text-[var(--ink)] font-mono focus:outline-none pl-1"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--ink-soft)] uppercase tracking-wider text-[10px]">
                    Cover Image URL (DigitalOcean CDN or local)
                  </label>
                  <input
                    type="text"
                    placeholder="https://cdn.verifik.co/mariesthetics/services/..."
                    value={formCoverImage}
                    onChange={(e) => setFormCoverImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--ink)] uppercase tracking-wider text-[10px]">
                  Excerpt / Summary (shown on cards &amp; newsletter intro)
                </label>
                <textarea
                  rows={2}
                  placeholder="A short, compelling summary of this post..."
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                />
              </div>

              {/* Linked Services Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--ink)] uppercase tracking-wider text-[10px]">
                  Link Studio Treatments / Services
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--background)]">
                  {initialServices.map((service) => {
                    const isSelected = formServiceIds.includes(service._id);
                    return (
                      <button
                        key={service._id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormServiceIds(formServiceIds.filter((id) => id !== service._id));
                          } else {
                            setFormServiceIds([...formServiceIds, service._id]);
                          }
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? "bg-[#c8a86b] text-black font-bold shadow-sm"
                            : "bg-[var(--card-bg)] text-[var(--ink-soft)] border border-[var(--border-color)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {service.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Editor / Live Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--ink)] uppercase tracking-wider text-[10px]">
                    Article Content (Markdown supported) *
                  </label>
                  <span className="text-[10px] text-[var(--ink-soft)]">
                    Supports ## Headings, lists, **bold**, and &gt; quotes
                  </span>
                </div>

                {previewMode ? (
                  <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--background)] min-h-[300px] prose prose-invert max-w-none text-xs space-y-3 leading-relaxed">
                    {formCoverImage && (
                      <img
                        src={formCoverImage}
                        alt="Preview Cover"
                        className="w-full max-h-64 object-cover rounded-2xl mb-4"
                      />
                    )}
                    <h1 className="text-xl font-bold text-[var(--ink)]">{formTitle || "Article Title"}</h1>
                    <div className="whitespace-pre-wrap text-[var(--ink)] text-sm">{formContent}</div>
                  </div>
                ) : (
                  <textarea
                    rows={12}
                    required
                    placeholder="Write your article content here in Markdown..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--background)] text-xs text-[var(--ink)] font-mono leading-relaxed focus:outline-none focus:border-[#c8a86b]"
                  />
                )}
              </div>

              {/* Promotional Footer Attachment Box */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[#c8a86b]/40 bg-[#c8a86b]/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--ink)]">
                        Attach Promotional Booking Offer &amp; Coupon
                      </h4>
                      <p className="text-[10px] text-[var(--ink-soft)]">
                        Automatically embeds an offer banner at the bottom of this blog article and in its newsletter.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={formPromoEnabled}
                    onChange={(e) => setFormPromoEnabled(e.target.checked)}
                    className="w-5 h-5 accent-[#c8a86b] rounded cursor-pointer"
                  />
                </div>

                {formPromoEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#c8a86b]/20 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-[var(--ink-soft)] text-[10px] uppercase">
                        Discount Promo Code (e.g. GLOW15)
                      </label>
                      <input
                        type="text"
                        placeholder="GLOW15"
                        value={formPromoCode}
                        onChange={(e) => setFormPromoCode(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] font-mono uppercase font-bold text-[#c8a86b]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[var(--ink-soft)] text-[10px] uppercase">
                        CTA Button Text
                      </label>
                      <input
                        type="text"
                        placeholder="Book Treatment Now →"
                        value={formCtaText}
                        onChange={(e) => setFormCtaText(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-[var(--ink)]"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="font-bold text-[var(--ink-soft)] text-[10px] uppercase">
                        Custom Promotional Offer Message
                      </label>
                      <input
                        type="text"
                        placeholder="Enjoy $20 off your first tailored facial session with Marinelle."
                        value={formPromoText}
                        onChange={(e) => setFormPromoText(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-[var(--ink)]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status Selector & Submit Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <label className="font-bold text-[var(--ink)] text-xs">Publishing Status:</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-xs font-bold text-[var(--ink)]"
                  >
                    <option value="published">🚀 Published (Live on Site)</option>
                    <option value="draft">📝 Draft (Private)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditorOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] hover:bg-white/5 cursor-pointer text-[var(--ink-soft)]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary text-xs !py-2.5 !px-6 shadow-lg cursor-pointer font-bold disabled:opacity-50"
                  >
                    {saving ? "Saving Post..." : editingPost ? "Save Changes →" : "Publish Article →"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── NEWSLETTER CAMPAIGN DISPATCH MODAL ── */}
      {newsletterModalOpen && targetPostForNewsletter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💌</span>
                <h3 className="text-base font-bold text-[var(--ink)]">Dispatch Newsletter</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewsletterModalOpen(false)}
                className="w-7 h-7 rounded-full border border-[var(--border-color)] flex items-center justify-center text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border-color)] space-y-1 text-xs">
              <span className="text-[10px] text-[#c8a86b] font-bold uppercase tracking-wider block">
                Selected Article
              </span>
              <p className="font-bold text-[var(--ink)] text-sm">{targetPostForNewsletter.title}</p>
              <p className="text-[11px] text-[var(--ink-soft)]">
                Language: <span className="uppercase font-semibold">{targetPostForNewsletter.language}</span>
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[var(--ink)] text-[11px] uppercase tracking-wider">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={newsletterSubject}
                  onChange={(e) => setNewsletterSubject(e.target.value)}
                  placeholder="e.g. ✨ New Skincare Insights from Mari Esthetics"
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--ink)] text-[11px] uppercase tracking-wider">
                  Target Subscriber Language
                </label>
                <select
                  value={newsletterTargetLang}
                  onChange={(e) => setNewsletterTargetLang(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-xs font-semibold text-[var(--ink)]"
                >
                  <option value="all">🌐 All Active Subscribers ({subscribers.filter((s) => s.status === "active").length})</option>
                  <option value="en">🇨🇦 English Subscribers ({subscribers.filter((s) => s.status === "active" && s.language === "en").length})</option>
                  <option value="es">🇪🇸 Spanish Subscribers ({subscribers.filter((s) => s.status === "active" && s.language === "es").length})</option>
                  <option value="tl">🇵🇭 Tagalog Subscribers ({subscribers.filter((s) => s.status === "active" && s.language === "tl").length})</option>
                </select>
              </div>
            </div>

            {targetPostForNewsletter.promoConfig?.enabled && (
              <div className="p-3 bg-leaf/10 border border-leaf/30 rounded-xl text-leaf text-xs flex items-center gap-2">
                <span>✓</span>
                <span>
                  Attached Promo: <strong>{targetPostForNewsletter.promoConfig.promoCode}</strong> will be included in the email footer.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setNewsletterModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] text-[var(--ink-soft)]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={dispatchingNewsletter}
                onClick={handleSendNewsletter}
                className="btn-primary text-xs !py-2.5 !px-6 font-bold cursor-pointer disabled:opacity-50"
              >
                {dispatchingNewsletter ? "Sending via Mailgun..." : "🚀 Send Newsletter Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
