import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const NewsletterDispatchSchema = new Schema(
  {
    blogId: { type: Schema.Types.ObjectId, ref: "BlogPost", required: true },
    subject: { type: String, required: true, trim: true },
    recipientsCount: { type: Number, default: 0 },
    language: { type: String, default: "all" },
    status: {
      type: String,
      enum: ["sent", "failed", "pending"],
      default: "sent",
    },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export type NewsletterDispatchDoc = InferSchemaType<typeof NewsletterDispatchSchema> & {
  _id: Types.ObjectId;
};

export const NewsletterDispatch =
  models.NewsletterDispatch || model("NewsletterDispatch", NewsletterDispatchSchema);
