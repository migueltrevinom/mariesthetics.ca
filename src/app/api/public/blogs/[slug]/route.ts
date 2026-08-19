import { NextResponse } from "next/server";
import { BlogRepository } from "@/app/api/admin/blogs/repositories/blog.repository";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language") || undefined;

    const post = await BlogRepository.findBySlug(slug, language);
    if (!post || post.status !== "published") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Increment click / view count asynchronously
    void BlogRepository.incrementViews(slug).catch((e) =>
      console.error("[Blog View Increment Error]:", e.message)
    );

    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    console.error("[Public Blog Post API Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}
