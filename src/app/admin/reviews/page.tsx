import type { Metadata } from "next";
import { requireManager } from "@/lib/auth/jwt";
import { ReviewRepository } from "@/app/api/admin/reviews/repositories/review.repository";
import { ReviewsManager } from "@/components/admin/ReviewsManager";

export const metadata: Metadata = {
  title: "Client Reviews | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminReviewsPage() {
  await requireManager();

  const { reviews } = await ReviewRepository.getAllReviews({ limit: 100 });

  const formattedReviews = reviews.map((r) => ({
    _id: String(r._id),
    createdAt: new Date(r.createdAt).toISOString(),
    submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString() : undefined,
    status: r.status,
    rating: r.rating,
    comment: r.comment,
    token: r.token,
    isVisibleOnLanding: Boolean(r.isVisibleOnLanding),
    guest: r.guest,
    serviceId: r.serviceId
      ? {
          _id: String(r.serviceId._id),
          name: r.serviceId.name,
        }
      : undefined,
    bookingId: r.bookingId
      ? {
          _id: String(r.bookingId._id),
          start: r.bookingId.start ? new Date(r.bookingId.start).toISOString() : undefined,
        }
      : undefined,
  }));

  return <ReviewsManager initialReviews={formattedReviews} />;
}
