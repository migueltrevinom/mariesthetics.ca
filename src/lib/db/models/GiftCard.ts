import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const GiftCardSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    initialBalanceCents: { type: Number, required: true, min: 1 },
    remainingBalanceCents: { type: Number, required: true, min: 0 },
    senderName: { type: String, default: "" },
    senderEmail: { type: String, default: "" },
    recipientName: { type: String, default: "" },
    recipientEmail: { type: String, required: true, trim: true },
    message: { type: String, default: "" },
    stripeCouponId: { type: String, default: "" },
    stripePromotionCodeId: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
    expiryDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export type GiftCardDoc = InferSchemaType<typeof GiftCardSchema> & {
  _id: Types.ObjectId;
};

export const GiftCard = models.GiftCard || model("GiftCard", GiftCardSchema);
