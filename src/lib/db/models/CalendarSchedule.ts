import mongoose, { Schema, Document, Model } from "mongoose";

export interface TimeShift {
  openTime: string;  // "09:00"
  closeTime: string; // "12:00"
}

export interface WeeklyHourSetting {
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  isOpen: boolean;
  shifts: TimeShift[];
}

export interface DateOverrideSetting {
  date: string; // "YYYY-MM-DD"
  isOpen: boolean;
  shifts?: TimeShift[];
  note?: string;
}

export interface ICalendarSchedule extends Document {
  weeklyHours: WeeklyHourSetting[];
  dateOverrides: DateOverrideSetting[];
  createdAt: Date;
  updatedAt: Date;
}

const TimeShiftSchema = new Schema<TimeShift>(
  {
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
  },
  { _id: false }
);

const WeeklyHourSchema = new Schema<WeeklyHourSetting>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    isOpen: { type: Boolean, required: true, default: true },
    shifts: {
      type: [TimeShiftSchema],
      default: [{ openTime: "09:00", closeTime: "18:00" }],
    },
  },
  { _id: false }
);

const DateOverrideSchema = new Schema<DateOverrideSetting>(
  {
    date: { type: String, required: true },
    isOpen: { type: Boolean, required: true },
    shifts: { type: [TimeShiftSchema], default: [] },
    note: { type: String },
  },
  { _id: false }
);

const CalendarScheduleSchema = new Schema<ICalendarSchedule>(
  {
    weeklyHours: {
      type: [WeeklyHourSchema],
      default: [
        { dayOfWeek: 0, isOpen: false, shifts: [{ openTime: "09:00", closeTime: "18:00" }] }, // Sun closed
        { dayOfWeek: 1, isOpen: true, shifts: [{ openTime: "09:00", closeTime: "12:00" }, { openTime: "13:00", closeTime: "20:00" }] }, // Mon with lunch break
        { dayOfWeek: 2, isOpen: true, shifts: [{ openTime: "08:00", closeTime: "20:00" }] }, // Tue
        { dayOfWeek: 3, isOpen: true, shifts: [{ openTime: "08:00", closeTime: "20:00" }] }, // Wed
        { dayOfWeek: 4, isOpen: true, shifts: [{ openTime: "09:00", closeTime: "18:00" }] }, // Thu
        { dayOfWeek: 5, isOpen: true, shifts: [{ openTime: "09:00", closeTime: "18:00" }] }, // Fri
        { dayOfWeek: 6, isOpen: true, shifts: [{ openTime: "09:00", closeTime: "17:00" }] }, // Sat
      ],
    },
    dateOverrides: { type: [DateOverrideSchema], default: [] },
  },
  { timestamps: true }
);

delete (mongoose.models as any).CalendarSchedule;

export const CalendarSchedule: Model<ICalendarSchedule> =
  mongoose.models.CalendarSchedule ||
  mongoose.model<ICalendarSchedule>("CalendarSchedule", CalendarScheduleSchema);

