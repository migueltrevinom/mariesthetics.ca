import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const ClientSettingsSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      unique: true,
    },
    remindersEnabled: { type: Boolean, default: true },
    marketingOptIn: { type: Boolean, default: false },
    preferredChannel: {
      type: String,
      enum: ["email", "sms", "whatsapp"],
      default: "email",
    },
  },
  { timestamps: true },
);

export type ClientSettingsDoc = InferSchemaType<typeof ClientSettingsSchema> & {
  _id: Types.ObjectId;
};

export const ClientSettings =
  models.ClientSettings || model("ClientSettings", ClientSettingsSchema);
