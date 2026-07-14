import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const ClientSubscriptionSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "past_due", "cancelled", "paused"],
      default: "active",
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    stripeSubscriptionId: { type: String, default: "" },
    visitsUsedThisPeriod: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type ClientSubscriptionDoc = InferSchemaType<
  typeof ClientSubscriptionSchema
> & { _id: Types.ObjectId };

export const ClientSubscription =
  models.ClientSubscription ||
  model("ClientSubscription", ClientSubscriptionSchema);
