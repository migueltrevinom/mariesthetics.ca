import { NextResponse } from "next/server";
import { getPublishedBlogPosts } from "@/lib/blog/queries";
import { parseLocale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocale(searchParams.get("language"));
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const result = await getPublishedBlogPosts(locale, { page, limit });

    return NextResponse.json({
      success: true,
      posts: result.posts,
      total: result.total,
      page,
      language: locale,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch blogs";
    console.error("[Public Blogs API Error]:", message);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}
