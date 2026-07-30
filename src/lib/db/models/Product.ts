import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    kind: {
      type: String,
      enum: ["full_payment", "deposit", "balance", "custom"],
      default: "full_payment",
      index: true,
    },
    priceCents: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      default: null,
      index: true,
    },
    stripeProductId: {
      type: String,
      default: "",
    },
    stripePriceId: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    sku: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export type ProductDoc = InferSchemaType<typeof ProductSchema> & {
  _id: Types.ObjectId;
};

export const Product = models.Product || model("Product", ProductSchema);
