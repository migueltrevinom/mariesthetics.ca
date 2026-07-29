import { connectDb } from "@/lib/db/connect";
import {
  CalendarSchedule,
  CalendarBlock,
  WeeklyHourSetting,
  DateOverrideSetting,
} from "@/lib/db/models";

export class ScheduleRepository {
  /**
   * Get or initialize the singleton CalendarSchedule document
   */
  static async getSchedule() {
    await connectDb();
    let schedule = await CalendarSchedule.findOne();
    if (!schedule) {
      schedule = await CalendarSchedule.create({});
    }
    return schedule;
  }

  /**
   * Update weekly hours setting
   */
  static async updateWeeklyHours(weeklyHours: WeeklyHourSetting[]) {
    await connectDb();
    const updated = await CalendarSchedule.findOneAndUpdate(
      {},
      { $set: { weeklyHours } },
      { new: true, upsert: true, runValidators: true }
    );
    return updated;
  }

  /**
   * Upsert a date-specific override
   */
  static async upsertDateOverride(override: DateOverrideSetting) {
    await connectDb();
    let schedule = await this.getSchedule();
    const existingIdx = schedule.dateOverrides.findIndex((o) => o.date === override.date);
    if (existingIdx >= 0) {
      schedule.dateOverrides[existingIdx] = override;
    } else {
      schedule.dateOverrides.push(override);
    }
    schedule.markModified("dateOverrides");
    await schedule.save();
    return schedule;
  }

  /**
   * Remove a date override
   */
  static async removeDateOverride(dateStr: string) {
    await connectDb();
    let schedule = await this.getSchedule();
    schedule.dateOverrides = schedule.dateOverrides.filter((o) => o.date !== dateStr);
    schedule.markModified("dateOverrides");
    await schedule.save();
    return schedule;
  }

  /**
   * Create a blackout time block
   */
  static async createBlock(params: { start: Date; end: Date; reason?: string; createdBy?: string }) {
    await connectDb();
    return CalendarBlock.create({
      start: params.start,
      end: params.end,
      reason: params.reason || "Blocked Time",
      createdBy: params.createdBy,
    });
  }

  /**
   * Find blackout blocks overlapping a datetime range
   */
  static async findBlocksInRange(start: Date, end: Date) {
    await connectDb();
    return CalendarBlock.find({
      start: { $lt: end },
      end: { $gt: start },
    }).sort({ start: 1 });
  }

  /**
   * Delete a blackout block by ID
   */
  static async deleteBlock(id: string) {
    await connectDb();
    return CalendarBlock.findByIdAndDelete(id);
  }
}
