import { NextResponse } from "next/server";
import { AuthError, requireManager } from "@/lib/auth/jwt";
import { ReviewRepository } from "@/app/api/admin/reviews/repositories/review.repository";

export async function GET(req: Request) {
  try {
    await requireManager();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const landingOnly = searchParams.get("landingOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const { reviews, total } = await ReviewRepository.getAllReviews({
      status,
      landingOnly,
      page,
      limit,
    });

    return NextResponse.json({ success: true, reviews, total, page, limit });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[Admin Get Reviews Error]:", err);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
