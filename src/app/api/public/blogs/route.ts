import { NextResponse } from "next/server";
import { BlogRepository } from "@/app/api/admin/blogs/repositories/blog.repository";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language") || "all";
    const serviceId = searchParams.get("serviceId") || "all";
    const category = searchParams.get("category") || "all";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const result = await BlogRepository.findAll({
      status: "published",
      language,
      serviceId,
      category,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      posts: result.posts,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (err: any) {
    console.error("[Public Blogs API Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}
