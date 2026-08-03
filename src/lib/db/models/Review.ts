import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const ReviewSchema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    guest: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: "" },
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    comment: {
      type: String,
      default: "",
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "submitted", "expired"],
      default: "pending",
      index: true,
    },
    isVisibleOnLanding: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailSentAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    managerNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export type ReviewDoc = InferSchemaType<typeof ReviewSchema> & {
  _id: Types.ObjectId;
};

export const Review = models.Review || model("Review", ReviewSchema);
