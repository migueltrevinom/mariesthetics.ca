import mongoose, { Schema, Document, Model } from "mongoose";

export interface WeeklyHourSetting {
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  isOpen: boolean;
  openTime: string; // "09:00"
  closeTime: string; // "18:00"
}

export interface DateOverrideSetting {
  date: string; // "YYYY-MM-DD"
  isOpen: boolean;
  openTime?: string; // "09:00"
  closeTime?: string; // "18:00"
  note?: string;
}

export interface ICalendarSchedule extends Document {
  weeklyHours: WeeklyHourSetting[];
  dateOverrides: DateOverrideSetting[];
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyHourSchema = new Schema<WeeklyHourSetting>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    isOpen: { type: Boolean, required: true, default: true },
    openTime: { type: String, required: true, default: "09:00" },
    closeTime: { type: String, required: true, default: "18:00" },
  },
  { _id: false }
);

const DateOverrideSchema = new Schema<DateOverrideSetting>(
  {
    date: { type: String, required: true },
    isOpen: { type: Boolean, required: true },
    openTime: { type: String },
    closeTime: { type: String },
    note: { type: String },
  },
  { _id: false }
);

const CalendarScheduleSchema = new Schema<ICalendarSchedule>(
  {
    weeklyHours: {
      type: [WeeklyHourSchema],
      default: [
        { dayOfWeek: 0, isOpen: false, openTime: "09:00", closeTime: "18:00" }, // Sun closed
        { dayOfWeek: 1, isOpen: true, openTime: "09:00", closeTime: "13:00" },  // Mon half day
        { dayOfWeek: 2, isOpen: true, openTime: "08:00", closeTime: "20:00" },  // Tue
        { dayOfWeek: 3, isOpen: true, openTime: "08:00", closeTime: "20:00" },  // Wed
        { dayOfWeek: 4, isOpen: true, openTime: "09:00", closeTime: "18:00" },  // Thu
        { dayOfWeek: 5, isOpen: true, openTime: "09:00", closeTime: "18:00" },  // Fri
        { dayOfWeek: 6, isOpen: true, openTime: "09:00", closeTime: "17:00" },  // Sat
      ],
    },
    dateOverrides: { type: [DateOverrideSchema], default: [] },
  },
  { timestamps: true }
);

export const CalendarSchedule: Model<ICalendarSchedule> =
  mongoose.models.CalendarSchedule ||
  mongoose.model<ICalendarSchedule>("CalendarSchedule", CalendarScheduleSchema);
