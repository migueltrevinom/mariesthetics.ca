import { connectDb } from "@/lib/db/connect";
import { StripePaymentLink } from "@/lib/db/models/StripePaymentLink";

export class StripePaymentLinkRepository {
	static async create(data: {
		bookingId?: string;
		clientEmail?: string;
		amountCents: number;
		kind: "deposit" | "balance" | "tip" | "custom";
		description: string;
		stripeSessionId: string;
		stripePaymentLinkUrl: string;
		status?: "pending" | "paid" | "expired" | "cancelled";
	}) {
		await connectDb();
		return StripePaymentLink.create(data);
	}

	static async findMany(params: { limit: number; skip: number }) {
		await connectDb();
		return StripePaymentLink.find()
			.sort({ createdAt: -1 })
			.skip(params.skip)
			.limit(params.limit)
			.populate("bookingId")
			.lean();
	}

	static async findBySessionId(stripeSessionId: string) {
		await connectDb();
		return StripePaymentLink.findOne({ stripeSessionId });
	}

	static async updateStatus(stripeSessionId: string, status: "paid" | "expired" | "cancelled", paidAt?: Date) {
		await connectDb();
		return StripePaymentLink.findOneAndUpdate(
			{ stripeSessionId },
			{ $set: { status, paidAt: paidAt || null } },
			{ new: true }
		);
	}
}
