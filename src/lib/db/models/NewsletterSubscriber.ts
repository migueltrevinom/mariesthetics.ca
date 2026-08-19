import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const NewsletterSubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, default: "", trim: true },
    language: {
      type: String,
      enum: ["en", "es", "tl", "pa", "ar"],
      default: "en",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active",
      index: true,
    },
    source: {
      type: String,
      enum: ["website", "booking", "blog", "admin"],
      default: "website",
    },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type NewsletterSubscriberDoc = InferSchemaType<typeof NewsletterSubscriberSchema> & {
  _id: Types.ObjectId;
};

export const NewsletterSubscriber =
  models.NewsletterSubscriber || model("NewsletterSubscriber", NewsletterSubscriberSchema);
