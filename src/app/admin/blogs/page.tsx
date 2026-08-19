import { AdminShell } from "@/components/admin/AdminShell";
import type { Metadata } from "next";
import { requireManager } from "@/lib/auth/jwt";
import { BlogRepository } from "@/app/api/admin/blogs/repositories/blog.repository";
import { SubscriberRepository } from "@/app/api/admin/blogs/repositories/subscriber.repository";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";
import { BlogManager } from "@/components/admin/BlogManager";

export const metadata: Metadata = {
  title: "Studio Blog & Newsletter | Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  await requireManager();
  await connectDb();

  const [postsData, rawServices, rawSubscribers, stats] = await Promise.all([
    BlogRepository.findAll({ limit: 50 }),
    Service.find({ isActive: true }).select("_id name slug priceCents").lean(),
    SubscriberRepository.getAllSubscribers(),
    BlogRepository.getStats(),
  ]);

  const formattedPosts = postsData.posts.map((p: any) => ({
    _id: String(p._id),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt || "",
    content: p.content || "",
    coverImage: p.coverImage || "",
    language: p.language || "en",
    serviceIds: (p.serviceIds || []).map((s: any) => ({
      _id: String(s._id || s),
      name: s.name || "Service",
      slug: s.slug || "",
    })),
    category: p.category || "",
    status: p.status || "draft",
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
    viewsCount: p.viewsCount || 0,
    metaTitle: p.metaTitle || "",
    metaDescription: p.metaDescription || "",
    author: p.author || "Marinelle Tala",
    promoConfig: p.promoConfig || {
      enabled: false,
      promoCode: "",
      customPromoText: "",
      ctaButtonText: "Book Treatment Now →",
      ctaUrl: "/book",
    },
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
  }));

  const formattedServices = rawServices.map((s: any) => ({
    _id: String(s._id),
    name: s.name,
    slug: s.slug || "",
    priceCents: s.priceCents || 0,
  }));

  const formattedSubscribers = rawSubscribers.map((sub: any) => ({
    _id: String(sub._id),
    email: sub.email,
    name: sub.name || "",
    language: sub.language || "en",
    status: sub.status || "active",
    source: sub.source || "website",
    subscribedAt: sub.subscribedAt ? new Date(sub.subscribedAt).toISOString() : new Date().toISOString(),
  }));

  return (
    <AdminShell>
      <BlogManager
        initialPosts={formattedPosts}
        initialServices={formattedServices}
        initialSubscribers={formattedSubscribers}
        initialStats={stats}
      />
    </AdminShell>
  );
}
