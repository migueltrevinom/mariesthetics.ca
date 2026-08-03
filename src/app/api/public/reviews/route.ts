import { NextResponse } from "next/server";
import { ReviewRepository } from "@/app/api/admin/reviews/repositories/review.repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reviews = await ReviewRepository.getPublicLandingReviews();
    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    console.error("[Get Public Reviews Error]:", err);
    return NextResponse.json({ error: "Failed to fetch featured reviews" }, { status: 500 });
  }
}
