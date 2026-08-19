import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const BlogPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, default: "", trim: true },
    content: { type: String, required: true },
    coverImage: { type: String, default: "", trim: true },
    language: {
      type: String,
      enum: ["en", "es", "tl", "pa", "ar"],
      default: "en",
      index: true,
    },
    serviceIds: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    category: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date, default: null },
    viewsCount: { type: Number, default: 0 },
    metaTitle: { type: String, default: "", trim: true },
    metaDescription: { type: String, default: "", trim: true },
    author: { type: String, default: "Marinelle Tala", trim: true },
    promoConfig: {
      enabled: { type: Boolean, default: false },
      promoCode: { type: String, default: "", trim: true },
      customPromoText: { type: String, default: "", trim: true },
      ctaButtonText: { type: String, default: "Book Treatment Now →", trim: true },
      ctaUrl: { type: String, default: "/book", trim: true },
    },
  },
  { timestamps: true }
);

export type BlogPostDoc = InferSchemaType<typeof BlogPostSchema> & {
  _id: Types.ObjectId;
};

export const BlogPost = models.BlogPost || model("BlogPost", BlogPostSchema);
