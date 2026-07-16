import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const StripePaymentLinkSchema = new Schema(
	{
		bookingId: {
			type: Schema.Types.ObjectId,
			ref: "Booking",
			default: null,
			index: true,
		},
		clientEmail: {
			type: String,
			default: "",
		},
		amountCents: {
			type: Number,
			required: true,
		},
		kind: {
			type: String,
			enum: ["deposit", "balance", "tip", "custom"],
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		stripeSessionId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		stripePaymentLinkUrl: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: ["pending", "paid", "expired", "cancelled"],
			default: "pending",
			index: true,
		},
		paidAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

export type StripePaymentLinkDoc = InferSchemaType<typeof StripePaymentLinkSchema> & {
	_id: Types.ObjectId;
};

export const StripePaymentLink =
	models.StripePaymentLink || model("StripePaymentLink", StripePaymentLinkSchema);
