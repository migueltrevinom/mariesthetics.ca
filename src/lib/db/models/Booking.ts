import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const GuestSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    countryCode: { type: String, default: "+1" },
    phone: { type: String, default: "" },
  },
  { _id: false },
);

const PaymentSummarySchema = new Schema(
  {
    totalCents: { type: Number, default: 0 },
    depositCents: { type: Number, default: 0 },
    paidCents: { type: Number, default: 0 },
    tipCents: { type: Number, default: 0 },
    discountCents: { type: Number, default: 0 },
    balanceDueCents: { type: Number, default: 0 },
  },
  { _id: false },
);

const BookingSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    guest: { type: GuestSnapshotSchema, default: null },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    start: { type: Date, required: true, index: true },
    end: { type: Date, required: true },
    status: {
      type: String,
      enum: ["held", "confirmed", "cancelled", "completed", "expired"],
      default: "held",
      index: true,
    },
    holdExpiresAt: { type: Date, default: null, index: true },
    depositMethod: {
      type: String,
      enum: ["stripe", "etransfer", "cash", "other"],
      default: undefined,
    },
    couponId: { type: Schema.Types.ObjectId, ref: "Coupon", default: null },
    promotionId: { type: Schema.Types.ObjectId, ref: "Promotion", default: null },
    referralCode: { type: String, default: "" },
    paymentSummary: { type: PaymentSummarySchema, default: () => ({}) },
    etransferProofUrl: { type: String, default: "" },
    etransferNote: { type: String, default: "" },
    reminder24hSent: { type: Boolean, default: false, index: true },
    reminder2hSent: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

BookingSchema.index({ start: 1, end: 1, status: 1 });

export type BookingDoc = InferSchemaType<typeof BookingSchema> & {
  _id: Types.ObjectId;
};

export const Booking = models.Booking || model("Booking", BookingSchema);
