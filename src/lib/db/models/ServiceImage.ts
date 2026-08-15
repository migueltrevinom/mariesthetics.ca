import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const ServiceImageSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    ipfsHash: { type: String, default: "" },
    url: { type: String, required: true },
    key: { type: String },
    type: { type: String, enum: ["service", "pre", "post"], default: "service" },
    isPrivate: { type: Boolean, default: false },
    filename: { type: String },
    mimeType: { type: String },
    size: { type: Number },
  },
  { timestamps: true }
);

export type ServiceImageDoc = InferSchemaType<typeof ServiceImageSchema> & {
  _id: Types.ObjectId;
  clientId?: Types.ObjectId | null;
};

export const ServiceImage = models.ServiceImage || model("ServiceImage", ServiceImageSchema);
