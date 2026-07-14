import { Schema, models, model, type InferSchemaType } from "mongoose";

const ManagerSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["owner", "manager"], default: "manager" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ManagerDoc = InferSchemaType<typeof ManagerSchema> & { _id: Schema.Types.ObjectId };

export const Manager = models.Manager || model("Manager", ManagerSchema);
