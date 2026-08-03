import { connectDb } from "@/lib/db/connect";
import { Review, Booking, Client } from "@/lib/db/models";
import { customAlphabet } from "nanoid";

const generateReviewToken = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 24);

export class ReviewRepository {
	/**
	 * Find existing review token for a booking or generate a new unique token.
	 */
	static async findOrCreateTokenForBooking(bookingId: string): Promise<any> {
		await connectDb();
		const booking = await Booking.findById(bookingId).populate("serviceId").lean();
		if (!booking) {
			throw new Error("Booking not found");
		}

		let existing = await Review.findOne({ bookingId: booking._id });
		if (existing) {
			return existing;
		}

		// Try finding linked client
		let clientId = booking.clientId || null;
		if (!clientId && booking.guest?.email) {
			const client = await Client.findOne({ email: booking.guest.email.toLowerCase().trim() });
			if (client) clientId = client._id;
		}

		const token = `rev_${generateReviewToken()}`;
		const newReview = await Review.create({
			bookingId: booking._id,
			clientId,
			serviceId: booking.serviceId?._id || booking.serviceId,
			guest: {
				name: booking.guest?.name || "Valued Client",
				email: booking.guest?.email || "",
				phone: booking.guest?.phone || "",
			},
			token,
			status: "pending",
			isVisibleOnLanding: false,
			emailSentAt: new Date(),
		});

		return newReview;
	}

	/**
	 * Validate token and fetch review details with populated booking and service info.
	 */
	static async findByToken(token: string): Promise<any> {
		await connectDb();
		const review = await Review.findOne({ token }).populate("serviceId").populate("bookingId").lean();
		return review;
	}

	/**
	 * Submit client rating and comment for a valid review token.
	 */
	static async submitReview(token: string, rating: number, comment: string): Promise<any> {
		await connectDb();
		const review = await Review.findOne({ token });
		if (!review) {
			throw new Error("Invalid or expired review token");
		}
		if (review.status === "submitted") {
			throw new Error("This review has already been submitted. Thank you!");
		}

		review.rating = Math.min(5, Math.max(1, rating));
		review.comment = comment ? comment.trim() : "";
		review.status = "submitted";
		review.submittedAt = new Date();
		await review.save();

		return review;
	}

	/**
	 * Get all reviews for admin manager dashboard with optional filtering.
	 */
	static async getAllReviews(
		options: {
			status?: string;
			landingOnly?: boolean;
			limit?: number;
			page?: number;
		} = {},
	): Promise<{ reviews: any[]; total: number }> {
		await connectDb();
		const query: any = {};
		if (options.status) query.status = options.status;
		if (options.landingOnly) query.isVisibleOnLanding = true;

		const limit = options.limit || 50;
		const page = options.page || 1;
		const skip = (page - 1) * limit;

		const total = await Review.countDocuments(query);
		const reviews = await Review.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.populate("serviceId")
			.populate("bookingId")
			.populate("clientId")
			.lean();

		return { reviews, total };
	}

	/**
	 * Toggle landing page visibility flag (isVisibleOnLanding).
	 */
	static async toggleLandingVisibility(reviewId: string, isVisible?: boolean): Promise<any> {
		await connectDb();
		const review = await Review.findById(reviewId);
		if (!review) {
			throw new Error("Review record not found");
		}

		review.isVisibleOnLanding = typeof isVisible === "boolean" ? isVisible : !review.isVisibleOnLanding;
		await review.save();
		return review;
	}

	/**
	 * Get all submitted reviews for a specific client.
	 */
	static async getReviewsByClient(clientId: string): Promise<any[]> {
		await connectDb();
		const reviews = await Review.find({ clientId }).sort({ createdAt: -1 }).populate("serviceId").populate("bookingId").lean();
		return reviews;
	}

	/**
	 * Get public featured reviews for landing page testimonials.
	 */
	static async getPublicLandingReviews(): Promise<any[]> {
		await connectDb();
		const reviews = await Review.find({ isVisibleOnLanding: true, status: "submitted" })
			.sort({ submittedAt: -1, rating: -1 })
			.limit(20)
			.populate("serviceId")
			.lean();
		return reviews;
	}
}
