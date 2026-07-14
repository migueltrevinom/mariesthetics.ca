import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const ReferralSchema = new Schema(
  {
    referrerClientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    refereeClientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "qualified", "rewarded", "cancelled"],
      default: "pending",
    },
    referrerRewardApplied: { type: Boolean, default: false },
    refereeRewardApplied: { type: Boolean, default: false },
    rewardType: { type: String, enum: ["percent", "fixed"], default: "percent" },
    rewardValue: { type: Number, default: 15 },
  },
  { timestamps: true },
);

export type ReferralDoc = InferSchemaType<typeof ReferralSchema> & {
  _id: Types.ObjectId;
};

export const Referral = models.Referral || model("Referral", ReferralSchema);
