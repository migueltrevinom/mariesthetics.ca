import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICalendarBlock extends Document {
  start: Date;
  end: Date;
  reason?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarBlockSchema = new Schema<ICalendarBlock>(
  {
    start: { type: Date, required: true, index: true },
    end: { type: Date, required: true, index: true },
    reason: { type: String, default: "Blocked Time" },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export const CalendarBlock: Model<ICalendarBlock> =
  mongoose.models.CalendarBlock ||
  mongoose.model<ICalendarBlock>("CalendarBlock", CalendarBlockSchema);
