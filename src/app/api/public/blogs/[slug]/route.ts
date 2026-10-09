import { NextResponse } from "next/server";
import { BlogRepository } from "@/app/api/admin/blogs/repositories/blog.repository";
import { serializeBlogPost } from "@/lib/blog/serialize";
import { resolveBlogPromo } from "@/lib/blog/resolvePromo";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const post = await BlogRepository.findBySlug(slug);
    if (!post || post.status !== "published") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const translationGroupId = String(post.translationGroupId || post._id);
    const siblings = await BlogRepository.findByTranslationGroupId(translationGroupId, {
      status: "published",
    });

    // Increment click / view count asynchronously
    void BlogRepository.incrementViews(slug).catch((e) =>
      console.error("[Blog View Increment Error]:", e.message)
    );

    const serialized = serializeBlogPost(post as Record<string, unknown>);
    const serviceIds = serialized.serviceIds;
    const resolvedPromo = await resolveBlogPromo({
      promoConfig: serialized.promoConfig,
      serviceIds,
      language: serialized.language,
    });

    return NextResponse.json({
      success: true,
      post: { ...serialized, resolvedPromo },
      translations: siblings.map((s: any) => ({
        _id: String(s._id),
        language: s.language,
        slug: s.slug,
        title: s.title,
        status: s.status,
      })),
    });
  } catch (err: any) {
    console.error("[Public Blog Post API Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}
