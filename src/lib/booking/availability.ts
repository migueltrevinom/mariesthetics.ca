import { addMinutes, isBefore, isAfter } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Booking, Service, CalendarBlock } from "@/lib/db/models";
import { getEffectiveDaySchedule } from "@/app/api/admin/schedule/modules/schedule.module";
import {
  createEdmontonDate,
  parseEdmontonDayIso,
  getEdmontonDateParts,
} from "@/lib/timezone";

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
  if (!schedule.isOpen || !schedule.shifts || schedule.shifts.length === 0) {
    return { service, slots: [] };
  }

  // Parse target date in Edmonton time
  const [yyyy, mm, dd] = dayIso.split("-").map(Number);
  const day = parseEdmontonDayIso(dayIso);
  const dayEnd = addMinutes(day, 24 * 60);

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

  // Iterate over each working shift for the day (e.g. Morning Shift 9-12, Afternoon Shift 1-8)
  for (const shift of schedule.shifts) {
    const [openHour, openMin] = shift.openTime.split(":").map(Number);
    const [closeHour, closeMin] = shift.closeTime.split(":").map(Number);

    let cursor = createEdmontonDate(yyyy, mm, dd, openHour, openMin);
    const shiftClose = createEdmontonDate(yyyy, mm, dd, closeHour, closeMin);

    while (true) {
      const proposedEnd = addMinutes(cursor, service.durationMin);
      // Must finish on or before closing time of the current shift
      if (isAfter(proposedEnd, shiftClose)) break;

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

  // 1. Check schedule operating hours & shifts for the start date in Edmonton timezone
  const { year, month, day: dayNum, isoDate: dayIso } = getEdmontonDateParts(start);

  const schedule = await getEffectiveDaySchedule(dayIso);
  if (!schedule.isOpen || !schedule.shifts || schedule.shifts.length === 0) {
    throw new Error("The studio is closed on this date.");
  }

  // Check if slot falls completely inside AT LEAST ONE working shift
  const fitsInShift = schedule.shifts.some((shift) => {
    const [openHour, openMin] = shift.openTime.split(":").map(Number);
    const [closeHour, closeMin] = shift.closeTime.split(":").map(Number);
    const open = createEdmontonDate(year, month, dayNum, openHour, openMin);
    const close = createEdmontonDate(year, month, dayNum, closeHour, closeMin);
    return !isBefore(start, open) && !isAfter(end, close);
  });

  if (!fitsInShift) {
    const shiftSummary = schedule.shifts
      .map((s) => `${s.openTime} – ${s.closeTime}`)
      .join(", ");
    throw new Error(`Appointments must fall within working shifts (${shiftSummary}).`);
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
