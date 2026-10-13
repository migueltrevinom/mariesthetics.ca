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
    vipRescheduleBypass: { type: Boolean, default: false },
    photoUrl: { type: String, default: "" },
    otp: {
      codeHash: { type: String, default: null },
      expiresAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export type ClientDoc = InferSchemaType<typeof ClientSchema> & {
  _id: Types.ObjectId;
  active: boolean;
  banned: boolean;
  photoUrl: string;
  otp?: {
    codeHash: string | null;
    expiresAt: Date | null;
    attempts: number;
  };
};

if (models.Client && !models.Client.schema.paths["otp.codeHash"]) {
  delete (models as any).Client;
}

export const Client = models.Client || model("Client", ClientSchema);
