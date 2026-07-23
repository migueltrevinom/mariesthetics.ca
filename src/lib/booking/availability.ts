import { addMinutes, setHours, setMinutes, startOfDay, isBefore, isAfter } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Booking, Service, CalendarBlock } from "@/lib/db/models";
import { getEffectiveDaySchedule } from "@/app/api/admin/schedule/modules/schedule.module";

const SLOT_STEP_MIN = 30;
const BUFFER_MIN = 30; // Minimum recovery break between appointments

export async function getAvailableSlots(serviceId: string, dayIso: string) {
  await connectDb();
  const service = await Service.findById(serviceId);
  if (!service || !service.active) {
    throw new Error("Service not found");
  }

  // Get effective schedule for this date (weekly default or custom date override)
  const schedule = await getEffectiveDaySchedule(dayIso);
  if (!schedule.isOpen) {
    return { service, slots: [] };
  }

  // Parse local day of target date
  const [yyyy, mm, dd] = dayIso.split("-").map(Number);
  const day = startOfDay(new Date(yyyy, mm - 1, dd)); // local time
  const dayEnd = addMinutes(day, 24 * 60);

  // Parse open and close times from schedule
  const [openHour, openMin] = schedule.openTime.split(":").map(Number);
  const [closeHour, closeMin] = schedule.closeTime.split(":").map(Number);

  // Fetch existing bookings for the day
  const existingBookings = await Booking.find({
    start: { $lt: dayEnd },
    end: { $gt: day },
    status: { $in: ["held", "confirmed"] },
  }).select("start end holdExpiresAt status");

  const now = new Date();
  const blockingBookings = existingBookings.filter((b) => {
    if (b.status === "confirmed") return true;
    if (b.status === "held") {
      return !b.holdExpiresAt || isAfter(b.holdExpiresAt, now);
    }
    return false;
  });

  // Fetch blackout blocks for the day
  const blackoutBlocks = await CalendarBlock.find({
    start: { $lt: dayEnd },
    end: { $gt: day },
  });

  const slots: { start: string; end: string }[] = [];
  let cursor = setMinutes(setHours(day, openHour), openMin);
  const close = setMinutes(setHours(day, closeHour), closeMin);

  while (true) {
    const proposedEnd = addMinutes(cursor, service.durationMin);
    // Must finish on or before closing time
    if (isAfter(proposedEnd, close)) break;

    if (!isBefore(cursor, now)) {
      // 1. Check overlaps with existing bookings + 30-min buffer
      const overlapsBooking = blockingBookings.some((b) => {
        const bufferedEnd = addMinutes(new Date(b.end), BUFFER_MIN);
        return cursor < bufferedEnd && proposedEnd > new Date(b.start);
      });

      // 2. Check overlaps with blackout blocks (breaks/blocked times)
      const overlapsBlackout = blackoutBlocks.some((blk) => {
        return cursor < new Date(blk.end) && proposedEnd > new Date(blk.start);
      });

      if (!overlapsBooking && !overlapsBlackout) {
        slots.push({ start: cursor.toISOString(), end: proposedEnd.toISOString() });
      }
    }

    cursor = addMinutes(cursor, SLOT_STEP_MIN);
  }

  return { service, slots };
}

export async function assertSlotFree(
  start: Date,
  end: Date,
  excludeBookingId?: string
) {
  await connectDb();
  const now = new Date();

  // 1. Check schedule operating hours for the start date
  const yyyy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const dd = String(start.getDate()).padStart(2, "0");
  const dayIso = `${yyyy}-${mm}-${dd}`;

  const schedule = await getEffectiveDaySchedule(dayIso);
  if (!schedule.isOpen) {
    throw new Error("The studio is closed on this date.");
  }

  const [openHour, openMin] = schedule.openTime.split(":").map(Number);
  const [closeHour, closeMin] = schedule.closeTime.split(":").map(Number);

  const day = startOfDay(start);
  const open = setMinutes(setHours(day, openHour), openMin);
  const close = setMinutes(setHours(day, closeHour), closeMin);

  if (isBefore(start, open) || isAfter(end, close)) {
    throw new Error(`Appointments must be between ${schedule.openTime} and ${schedule.closeTime}.`);
  }

  // 2. Check blackout blocks
  const blackoutConflicts = await CalendarBlock.find({
    start: { $lt: end },
    end: { $gt: start },
  });

  if (blackoutConflicts.length > 0) {
    const reason = blackoutConflicts[0].reason || "a scheduled blackout period";
    throw new Error(`That time slot conflicts with ${reason}.`);
  }

  // 3. Check existing bookings + 30-min recovery buffer
  const bufferedStart = addMinutes(start, -BUFFER_MIN);
  const query: Record<string, unknown> = {
    start: { $lt: addMinutes(end, BUFFER_MIN) },
    end: { $gt: bufferedStart },
    status: { $in: ["held", "confirmed"] },
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflicts = await Booking.find(query);
  const blocking = conflicts.filter((b) => {
    if (b.status === "confirmed") return true;
    return !b.holdExpiresAt || isAfter(b.holdExpiresAt, now);
  });

  const precise = blocking.filter((b) => {
    const bufferedEnd = addMinutes(new Date(b.end), BUFFER_MIN);
    return start < bufferedEnd && end > new Date(b.start);
  });

  if (precise.length > 0) {
    throw new Error(
      "That time slot is no longer available — a 30-minute recovery buffer is required between appointments."
    );
  }
}
