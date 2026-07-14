import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const PromotionSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    discountType: { type: String, enum: ["percent", "fixed"], required: true },
    discountValue: { type: Number, required: true },
    serviceIds: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type PromotionDoc = InferSchemaType<typeof PromotionSchema> & {
  _id: Types.ObjectId;
};

export const Promotion = models.Promotion || model("Promotion", PromotionSchema);
