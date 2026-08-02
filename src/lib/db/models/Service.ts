import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const ServiceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    durationMin: { type: Number, required: true, min: 15 },
    priceCents: { type: Number, required: true, min: 0 },
    depositCents: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    category: { type: String, default: "general" },
    photos: { type: [String], default: [] },
    slug: { type: String, trim: true, default: "" },
    metaTitle: { type: String, trim: true, default: "" },
    metaDescription: { type: String, trim: true, default: "" },
    keywords: { type: String, trim: true, default: "" },
    nameTranslations: {
      en: { type: String, default: "" },
      tl: { type: String, default: "" },
      pa: { type: String, default: "" },
      ar: { type: String, default: "" },
      es: { type: String, default: "" },
    },
    descriptionTranslations: {
      en: { type: String, default: "" },
      tl: { type: String, default: "" },
      pa: { type: String, default: "" },
      ar: { type: String, default: "" },
      es: { type: String, default: "" },
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  },
);

ServiceSchema.virtual("images", {
  ref: "ServiceImage",
  localField: "_id",
  foreignField: "serviceId",
});

export type ServiceDoc = InferSchemaType<typeof ServiceSchema> & {
  _id: Types.ObjectId;
  images?: any[];
};

export const Service = models.Service || model("Service", ServiceSchema);
