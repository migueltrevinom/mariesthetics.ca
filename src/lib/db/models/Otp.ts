import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const OtpSchema = new Schema(
  {
    target: { type: String, required: true, lowercase: true, trim: true, index: true },
    channel: { type: String, enum: ["email", "sms"], required: true },
    purpose: {
      type: String,
      enum: ["client_login", "manager_login", "link_account"],
      required: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ target: 1, purpose: 1, createdAt: -1 });

export type OtpDoc = InferSchemaType<typeof OtpSchema> & { _id: Types.ObjectId };

export const Otp = models.Otp || model("Otp", OtpSchema);
