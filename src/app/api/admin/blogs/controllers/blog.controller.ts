import { NextResponse } from "next/server";
import {
  createBlogPost,
  updateBlogPost,
  getBlogPosts,
  getBlogPostById,
  deleteBlogPost,
  getBlogStatistics,
} from "../modules/blog.module";
import { dispatchBlogNewsletter } from "../modules/newsletter.module";
import { getAppUrl } from "@/lib/config";

export async function handleGetBlogs(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language") || "all";
    const status = searchParams.get("status") || "all";
    const serviceId = searchParams.get("serviceId") || "all";
    const category = searchParams.get("category") || "all";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const [result, stats] = await Promise.all([
      getBlogPosts({ language, status, serviceId, category, search, page, limit }),
      getBlogStatistics(),
    ]);

    return NextResponse.json({
      success: true,
      posts: result.posts,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      stats,
    });
  } catch (err: any) {
    console.error("[Blog Controller Get Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function handleCreateBlog(req: Request, validatedData: any): Promise<NextResponse> {
  try {
    const post = await createBlogPost(validatedData);
    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (err: any) {
    console.error("[Blog Controller Create Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to create blog" }, { status: 500 });
  }
}

export async function handleGetBlogById(req: Request, id: string): Promise<NextResponse> {
  try {
    const post = await getBlogPostById(id);
    if (!post) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    console.error("[Blog Controller GetById Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch blog post" }, { status: 500 });
  }
}

export async function handleUpdateBlog(req: Request, validatedData: any, id: string): Promise<NextResponse> {
  try {
    const post = await updateBlogPost(id, validatedData);
    if (!post) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    console.error("[Blog Controller Update Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to update blog" }, { status: 500 });
  }
}

export async function handleDeleteBlog(req: Request, id: string): Promise<NextResponse> {
  try {
    const post = await deleteBlogPost(id);
    if (!post) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Blog post deleted", post });
  } catch (err: any) {
    console.error("[Blog Controller Delete Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to delete blog" }, { status: 500 });
  }
}

export async function handleSendBlogNewsletter(
  req: Request,
  validatedData: { subject: string; targetLanguage?: string },
  id: string
): Promise<NextResponse> {
  try {
    const baseUrl = getAppUrl(req);
    const result = await dispatchBlogNewsletter({
      blogId: id,
      subject: validatedData.subject,
      targetLanguage: validatedData.targetLanguage,
      baseUrl,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Blog Controller Newsletter Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to dispatch newsletter" }, { status: 500 });
  }
}
