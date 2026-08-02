import { ScheduleRepository } from "../repositories/schedule.repository";
import { WeeklyHourSetting, DateOverrideSetting, TimeShift } from "@/lib/db/models";
import { createEdmontonDate, getEdmontonDateParts } from "@/lib/timezone";

export async function getScheduleConfig() {
  const schedule = await ScheduleRepository.getSchedule();
  const now = new Date();
  // Fetch blackout blocks starting from 30 days ago to 90 days in future
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const blocks = await ScheduleRepository.findBlocksInRange(from, to);
  return { schedule, blocks };
}

export async function getEffectiveDaySchedule(dayIso: string) {
  const schedule = await ScheduleRepository.getSchedule();

  // Check for date override first
  const override = schedule.dateOverrides.find((o) => o.date === dayIso);
  if (override) {
    let shifts: TimeShift[] = override.shifts || [];
    if (shifts.length === 0 && (override as any).openTime && (override as any).closeTime) {
      shifts = [{ openTime: (override as any).openTime, closeTime: (override as any).closeTime }];
    }
    return {
      date: dayIso,
      isOpen: override.isOpen,
      shifts,
      note: override.note,
      isOverride: true,
    };
  }

  // Parse day of week in Edmonton local time
  const [yyyy, mm, dd] = dayIso.split("-").map(Number);
  const edmontonDate = createEdmontonDate(yyyy, mm, dd, 12, 0);
  const dayOfWeek = getEdmontonDateParts(edmontonDate).dayOfWeek;

  const weeklySetting = schedule.weeklyHours.find((w) => w.dayOfWeek === dayOfWeek);
  let shifts: TimeShift[] = weeklySetting?.shifts || [];
  if (shifts.length === 0) {
    const legacyOpen = (weeklySetting as any)?.openTime || "09:00";
    const legacyClose = (weeklySetting as any)?.closeTime || "18:00";
    shifts = [{ openTime: legacyOpen, closeTime: legacyClose }];
  }

  return {
    date: dayIso,
    isOpen: weeklySetting ? weeklySetting.isOpen : dayOfWeek !== 0,
    shifts,
    isOverride: false,
  };
}

export async function updateWeeklySchedule(weeklyHours: WeeklyHourSetting[]) {
  return ScheduleRepository.updateWeeklyHours(weeklyHours);
}

export async function saveDateOverride(override: DateOverrideSetting) {
  return ScheduleRepository.upsertDateOverride(override);
}

export async function deleteDateOverride(dateStr: string) {
  return ScheduleRepository.removeDateOverride(dateStr);
}

export async function createBlackoutBlock(params: { start: string; end: string; reason?: string }) {
  const startDate = new Date(params.start);
  const endDate = new Date(params.end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Invalid start or end datetime.");
  }
  if (startDate >= endDate) {
    throw new Error("Start time must be before end time.");
  }
  return ScheduleRepository.createBlock({
    start: startDate,
    end: endDate,
    reason: params.reason,
  });
}

export async function deleteBlackoutBlock(id: string) {
  return ScheduleRepository.deleteBlock(id);
}
