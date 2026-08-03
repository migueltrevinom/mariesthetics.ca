import { NextResponse } from "next/server";
import {
	createAndSendReviewRequest,
	validateReviewToken,
	submitReviewFeedback,
	fetchAdminReviews,
	toggleReviewLandingVisibility,
	fetchPublicLandingReviews,
} from "../modules/review.module";

export async function handleCreateReviewRequest(
	req: Request,
	validatedData: { bookingId: string },
): Promise<NextResponse> {
	try {
		const result = await createAndSendReviewRequest(validatedData.bookingId);
		return NextResponse.json({
			success: true,
			message: `Review request sent to ${result.guestEmail}`,
			reviewUrl: result.reviewUrl,
			token: result.token,
		});
	} catch (err: any) {
		console.error("[Review Controller Request Error]:", err.message);
		return NextResponse.json({ error: err.message || "Failed to send review request" }, { status: 500 });
	}
}

export async function handleValidateReviewToken(req: Request): Promise<NextResponse> {
	try {
		const { searchParams } = new URL(req.url);
		const token = searchParams.get("token");

		if (!token) {
			return NextResponse.json({ error: "Review token is missing" }, { status: 400 });
		}

		const review = await validateReviewToken(token);
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
		console.error("[Review Controller Validate Error]:", err.message);
		return NextResponse.json({ error: err.message || "Failed to validate review token" }, { status: 404 });
	}
}

export async function handleSubmitReview(
	req: Request,
	validatedData: { token: string; rating: number; comment?: string },
): Promise<NextResponse> {
	try {
		const review = await submitReviewFeedback(validatedData.token, validatedData.rating, validatedData.comment || "");
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
		console.error("[Review Controller Submit Error]:", err.message);
		return NextResponse.json({ error: err.message || "Failed to submit review" }, { status: 500 });
	}
}

export async function handleGetAllReviews(req: Request): Promise<NextResponse> {
	try {
		const { searchParams } = new URL(req.url);
		const status = searchParams.get("status") || undefined;
		const landingOnly = searchParams.get("landingOnly") === "true";
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "50", 10);

		const { reviews, total } = await fetchAdminReviews({ status, landingOnly, page, limit });
		return NextResponse.json({ success: true, reviews, total, page, limit });
	} catch (err: any) {
		console.error("[Review Controller Get All Error]:", err.message);
		return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
	}
}

export async function handleToggleVisibility(
	req: Request,
	reviewId: string,
	validatedData: { isVisibleOnLanding?: boolean },
): Promise<NextResponse> {
	try {
		const review = await toggleReviewLandingVisibility(reviewId, validatedData.isVisibleOnLanding);
		return NextResponse.json({
			success: true,
			isVisibleOnLanding: review.isVisibleOnLanding,
			review,
		});
	} catch (err: any) {
		console.error("[Review Controller Toggle Visibility Error]:", err.message);
		return NextResponse.json({ error: err.message || "Failed to toggle review visibility" }, { status: 500 });
	}
}

export async function handleGetPublicReviews(): Promise<NextResponse> {
	try {
		const reviews = await fetchPublicLandingReviews();
		return NextResponse.json({ success: true, reviews });
	} catch (err: any) {
		console.error("[Review Controller Get Public Error]:", err.message);
		return NextResponse.json({ error: "Failed to fetch featured reviews" }, { status: 500 });
	}
}
