import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const SubscriptionPlanSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    interval: { type: String, enum: ["month", "year"], required: true },
    priceCents: { type: Number, required: true },
    billingNote: { type: String, default: "" },
    includedServiceIds: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    visitsPerPeriod: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
    stripePriceId: { type: String, default: "" },
  },
  { timestamps: true },
);

export type SubscriptionPlanDoc = InferSchemaType<
  typeof SubscriptionPlanSchema
> & { _id: Types.ObjectId };

export const SubscriptionPlan =
  models.SubscriptionPlan || model("SubscriptionPlan", SubscriptionPlanSchema);
