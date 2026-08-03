import { NextResponse } from "next/server";
import { z } from "zod";
import { ReviewRepository } from "@/app/api/admin/reviews/repositories/review.repository";

const bodySchema = z.object({
  token: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());

    const review = await ReviewRepository.submitReview(body.token, body.rating, body.comment);

    return NextResponse.json({
      success: true,
      message: "Thank you for submitting your review!",
      review: {
        _id: String(review._id),
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        submittedAt: review.submittedAt,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error("[Submit Review Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to submit review" }, { status: 500 });
  }
}
