import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITranslation {
  page: string; // e.g. 'hero', 'footer', 'services', 'booking', 'contact', 'membership', 'general'
  key: string;  // e.g. 'hero.title1', 'hero.ctaBook', 'footer.tagline'
  translations: {
    en?: string;
    tl?: string;
    pa?: string;
    ar?: string;
    es?: string;
  };
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TranslationDoc extends ITranslation, Document {}

const TranslationSchema = new Schema<TranslationDoc>(
  {
    page: { type: String, required: true, index: true },
    key: { type: String, required: true, index: true },
    translations: {
      en: { type: String, default: "" },
      tl: { type: String, default: "" },
      pa: { type: String, default: "" },
      ar: { type: String, default: "" },
      es: { type: String, default: "" },
    },
    updatedBy: { type: String },
  },
  {
    timestamps: true,
  }
);

// Compound unique index on page + key
TranslationSchema.index({ page: 1, key: 1 }, { unique: true });

export const TranslationModel: Model<TranslationDoc> =
  mongoose.models.Translation || mongoose.model<TranslationDoc>("Translation", TranslationSchema);
