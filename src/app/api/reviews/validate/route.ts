import { NextResponse } from "next/server";
import { ReviewRepository } from "@/app/api/admin/reviews/repositories/review.repository";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Review token is missing" }, { status: 400 });
    }

    const review = await ReviewRepository.findByToken(token);
    if (!review) {
      return NextResponse.json({ error: "Invalid or expired review link" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      review: {
        _id: String(review._id),
        status: review.status,
        rating: review.rating,
        comment: review.comment,
        guestName: review.guest?.name || "Valued Client",
        serviceName: (review.serviceId as any)?.name || "Esthetics Treatment",
        durationMin: (review.serviceId as any)?.durationMin || 60,
        appointmentDate: (review.bookingId as any)?.start
          ? new Date((review.bookingId as any).start).toISOString()
          : null,
      },
    });
  } catch (err: any) {
    console.error("[Validate Review Token Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to validate review token" }, { status: 500 });
  }
}
