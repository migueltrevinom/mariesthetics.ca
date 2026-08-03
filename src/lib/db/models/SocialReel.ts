import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const SocialReelSchema = new Schema(
  {
    platform: {
      type: String,
      enum: ["instagram", "tiktok"],
      required: true,
    },
    videoUrl: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, required: true, trim: true },
    externalUrl: { type: String, default: "", trim: true },
    caption: { type: String, default: "", trim: true },
    serviceName: { type: String, default: "", trim: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type SocialReelDoc = InferSchemaType<typeof SocialReelSchema> & {
  _id: Types.ObjectId;
};

export const SocialReel = models.SocialReel || model("SocialReel", SocialReelSchema);
