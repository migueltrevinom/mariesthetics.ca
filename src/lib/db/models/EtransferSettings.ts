import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const EtransferSettingsSchema = new Schema(
  {
    accountName: { type: String, required: true, default: "Mari Esthetics / Marinelle Tala" },
    email: { type: String, required: true, default: "mari@mariesthetics.ca" },
    countryCode: { type: String, default: "+1" },
    phone: { type: String, required: true, default: "7809133081" },
    autoDepositEnabled: { type: Boolean, default: true },
    instructions: {
      type: String,
      default: "Please include your appointment date and full name in the e-Transfer note.",
    },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

export type EtransferSettingsDoc = InferSchemaType<typeof EtransferSettingsSchema> & {
  _id: Types.ObjectId;
};

export const EtransferSettings =
  models.EtransferSettings || model("EtransferSettings", EtransferSettingsSchema);
