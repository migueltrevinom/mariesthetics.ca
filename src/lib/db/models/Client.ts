import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const ClientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    countryCode: { type: String, trim: true, default: "+1" },
    phone: { type: String, trim: true, default: "" },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    /** Active client subscription document id */
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "ClientSubscription",
      default: null,
    },
    stripeCustomerId: { type: String, default: "" },
    active: { type: Boolean, default: true },
    banned: { type: Boolean, default: false },
    photoUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

export type ClientDoc = InferSchemaType<typeof ClientSchema> & {
  _id: Types.ObjectId;
  active: boolean;
  banned: boolean;
  photoUrl: string;
};

export const Client = models.Client || model("Client", ClientSchema);
