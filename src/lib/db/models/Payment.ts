import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const PaymentSchema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ["deposit", "balance", "tip", "adjustment"],
      required: true,
    },
    method: {
      type: String,
      enum: ["stripe", "etransfer", "cash"],
      required: true,
    },
    amountCents: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    stripePaymentIntentId: { type: String, default: "" },
    stripeCheckoutSessionId: { type: String, default: "" },
    referenceNumber: { type: String, default: "" },
    proofUrl: { type: String, default: "" },
    note: { type: String, default: "" },
    confirmedBy: { type: Schema.Types.ObjectId, ref: "Manager", default: null },
    confirmedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type PaymentDoc = InferSchemaType<typeof PaymentSchema> & {
  _id: Types.ObjectId;
};

export const Payment = models.Payment || model("Payment", PaymentSchema);
