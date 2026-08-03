import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true },
    maxRedemptions: { type: Number, default: null },
    redemptionCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true, index: true },
    stripeCouponId: { type: String, default: "" },
    stripePromotionCodeId: { type: String, default: "" },
  },
  { timestamps: true }
);

export type CouponDoc = InferSchemaType<typeof CouponSchema> & {
  _id: Types.ObjectId;
};

export const Coupon = models.Coupon || model("Coupon", CouponSchema);
