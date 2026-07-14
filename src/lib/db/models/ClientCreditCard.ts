import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const ClientCreditCardSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    stripePaymentMethodId: { type: String, required: true },
    brand: { type: String, default: "" },
    last4: { type: String, default: "" },
    expMonth: { type: Number, default: 0 },
    expYear: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type ClientCreditCardDoc = InferSchemaType<
  typeof ClientCreditCardSchema
> & { _id: Types.ObjectId };

export const ClientCreditCard =
  models.ClientCreditCard || model("ClientCreditCard", ClientCreditCardSchema);
