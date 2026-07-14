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
  },
  { timestamps: true },
);

export type ServiceDoc = InferSchemaType<typeof ServiceSchema> & {
  _id: Types.ObjectId;
};

export const Service = models.Service || model("Service", ServiceSchema);
