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

type ServiceInput = string | { durationMin: number; active: boolean; [key: string]: unknown };

export async function getAvailableSlots(serviceInput: ServiceInput, dayIso: string) {
  await connectDb();
  let service: { durationMin: number; active: boolean; [key: string]: unknown } | null = null;
  if (typeof serviceInput === "string") {
    // Performance optimization: select only durationMin and active fields with .lean() to reduce DB payload size
    service = await Service.findById(serviceInput).select("durationMin active").lean();
  } else {
    service = serviceInput;
  }

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

  // Fetch existing bookings for the day (.lean() avoids Mongoose document hydration overhead)
  const existingBookings = await Booking.find({
    start: { $lt: dayEnd },
    end: { $gt: day },
    status: { $in: ["held", "confirmed"] },
  })
    .select("start end holdExpiresAt status")
    .lean();

  const now = new Date();
  const blockingBookings = existingBookings.filter((b) => {
    if (b.status === "confirmed") return true;
    if (b.status === "held") {
      return !b.holdExpiresAt || isAfter(new Date(b.holdExpiresAt), now);
    }
    return false;
  });

  // Fetch blackout blocks for the day (.lean() avoids Mongoose document hydration overhead)
  const blackoutBlocks = await CalendarBlock.find({
    start: { $lt: dayEnd },
    end: { $gt: day },
  }).lean();

  const slots: { start: string; end: string }[] = [];

  const nowMs = now.getTime();
  const bufferMs = BUFFER_MIN * 60 * 1000;
  const durationMs = service.durationMin * 60 * 1000;
  const slotStepMs = SLOT_STEP_MIN * 60 * 1000;

  // Performance optimization: Pre-parse bookings and blackout blocks into timestamp ranges.
  // This avoids hundreds of repeated Date object allocations and date-fns function calls inside the slot calculation loops.
  const parsedBlockingBookings = blockingBookings.map((b) => ({
    startMs: new Date(b.start).getTime(),
    bufferedEndMs: new Date(b.end).getTime() + bufferMs,
  }));

  const parsedBlackoutBlocks = blackoutBlocks.map((blk) => ({
    startMs: new Date(blk.start).getTime(),
    endMs: new Date(blk.end).getTime(),
  }));

  // Iterate over each working shift for the day (e.g. Morning Shift 9-12, Afternoon Shift 1-8)
  for (const shift of schedule.shifts) {
    const [openHour, openMin] = shift.openTime.split(":").map(Number);
    const [closeHour, closeMin] = shift.closeTime.split(":").map(Number);

    const shiftOpenDate = createEdmontonDate(yyyy, mm, dd, openHour, openMin);
    const shiftCloseDate = createEdmontonDate(yyyy, mm, dd, closeHour, closeMin);

    let cursorMs = shiftOpenDate.getTime();
    const shiftCloseMs = shiftCloseDate.getTime();

    while (true) {
      const proposedEndMs = cursorMs + durationMs;
      // Must finish on or before closing time of the current shift
      if (proposedEndMs > shiftCloseMs) break;

      if (cursorMs >= nowMs) {
        // 1. Check overlaps with existing bookings + 30-min buffer (numeric comparison is ~10-20x faster)
        const overlapsBooking = parsedBlockingBookings.some((b) => {
          return cursorMs < b.bufferedEndMs && proposedEndMs > b.startMs;
        });

        // 2. Check overlaps with blackout blocks (breaks/blocked times)
        const overlapsBlackout = parsedBlackoutBlocks.some((blk) => {
          return cursorMs < blk.endMs && proposedEndMs > blk.startMs;
        });

        if (!overlapsBooking && !overlapsBlackout) {
          slots.push({
            start: new Date(cursorMs).toISOString(),
            end: new Date(proposedEndMs).toISOString(),
          });
        }
      }

      cursorMs += slotStepMs;
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

  // 2. Check blackout blocks (.lean() avoids Mongoose document hydration overhead)
  const blackoutConflicts = await CalendarBlock.find({
    start: { $lt: end },
    end: { $gt: start },
  }).lean();

  if (blackoutConflicts.length > 0) {
    const reason = blackoutConflicts[0].reason || "a scheduled blackout period";
    throw new Error(`That time slot conflicts with ${reason}.`);
  }

  // 3. Check existing bookings + 30-min recovery buffer (.lean() avoids Mongoose document hydration overhead)
  const bufferedStart = addMinutes(start, -BUFFER_MIN);
  const query: Record<string, unknown> = {
    start: { $lt: addMinutes(end, BUFFER_MIN) },
    end: { $gt: bufferedStart },
    status: { $in: ["held", "confirmed"] },
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflicts = await Booking.find(query).lean();
  const blocking = conflicts.filter((b) => {
    if (b.status === "confirmed") return true;
    return !b.holdExpiresAt || isAfter(new Date(b.holdExpiresAt), now);
  });

  const startMs = start.getTime();
  const endMs = end.getTime();
  const bufferMs = BUFFER_MIN * 60 * 1000;

  // Performance optimization: Pre-parse booking timestamps to avoid repeated Date instantiations in filter.
  const precise = blocking.filter((b) => {
    const bStartMs = new Date(b.start).getTime();
    const bBufferedEndMs = new Date(b.end).getTime() + bufferMs;
    return startMs < bBufferedEndMs && endMs > bStartMs;
  });

  if (precise.length > 0) {
    throw new Error(
      "That time slot is no longer available — a 30-minute recovery buffer is required between appointments."
    );
  }
}
