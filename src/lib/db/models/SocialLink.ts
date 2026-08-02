import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const SocialLinkSchema = new Schema(
  {
    platform: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type SocialLinkDoc = InferSchemaType<typeof SocialLinkSchema> & {
  _id: Types.ObjectId;
};

export const SocialLink = models.SocialLink || model("SocialLink", SocialLinkSchema);
