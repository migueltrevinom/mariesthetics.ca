import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const TIP_PERCENTS = [0, 10, 15, 20] as const;

const StudioChargeSchema = new Schema(
  {
    baseAmountCents: { type: Number, required: true },
    tipPercent: { type: Number, required: true, enum: TIP_PERCENTS, default: 10 },
    tipCents: { type: Number, required: true, min: 0 },
    totalCents: { type: Number, required: true },
    clientName: { type: String, default: "" },
    clientEmail: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: "Mari Esthetics" },
    status: {
      type: String,
      enum: ["open", "paid", "cancelled"],
      default: "open",
      index: true,
    },
    tipChanges: { type: Number, default: 0, min: 0 },
    stripeCheckoutSessionId: { type: String, default: "" },
    checkoutUrl: { type: String, default: "" },
    paidAt: { type: Date, default: null },
    invoiceSentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

StudioChargeSchema.pre("validate", function () {
  const base = this.baseAmountCents;
  const percent = this.tipPercent;
  if (typeof base !== "number" || typeof percent !== "number") return;
  this.tipCents = Math.round((base * percent) / 100);
  this.totalCents = base + this.tipCents;
});

export type StudioChargeDoc = InferSchemaType<typeof StudioChargeSchema> & {
  _id: Types.ObjectId;
};

export const StudioCharge = models.StudioCharge || model("StudioCharge", StudioChargeSchema);
