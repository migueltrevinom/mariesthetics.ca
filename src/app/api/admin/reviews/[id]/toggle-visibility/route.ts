import { NextResponse } from "next/server";
import { AuthError, requireManager } from "@/lib/auth/jwt";
import { ReviewRepository } from "@/app/api/admin/reviews/repositories/review.repository";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const review = await ReviewRepository.toggleLandingVisibility(
      id,
      typeof body.isVisibleOnLanding === "boolean" ? body.isVisibleOnLanding : undefined
    );

    return NextResponse.json({
      success: true,
      isVisibleOnLanding: review.isVisibleOnLanding,
      review,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[Toggle Review Visibility Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to toggle review visibility" }, { status: 500 });
  }
}
