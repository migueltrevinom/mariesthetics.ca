import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    imageUrl: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export type CategoryDoc = InferSchemaType<typeof CategorySchema> & {
  _id: Types.ObjectId;
};

export const Category = models.Category || model("Category", CategorySchema);
