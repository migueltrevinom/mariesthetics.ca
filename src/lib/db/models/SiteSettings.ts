import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const SiteSettingsSchema = new Schema(
  {
    showReelsShowcase: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type SiteSettingsDoc = InferSchemaType<typeof SiteSettingsSchema> & {
  _id: Types.ObjectId;
};

export const SiteSettings = models.SiteSettings || model("SiteSettings", SiteSettingsSchema);

/** Returns the singleton settings document, creating one if missing. */
export async function getOrCreateSettings(): Promise<SiteSettingsDoc> {
  let doc = await SiteSettings.findOne().lean();
  if (!doc) {
    doc = await SiteSettings.create({});
    doc = doc.toObject();
  }
  return doc as SiteSettingsDoc;
}

/** Atomically updates the singleton settings document. */
export async function updateSettings(updates: Partial<Pick<SiteSettingsDoc, "showReelsShowcase">>) {
  return SiteSettings.findOneAndUpdate({}, { $set: updates }, { upsert: true, returnDocument: "after" }).lean();
}
