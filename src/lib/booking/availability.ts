import { addMinutes, setHours, setMinutes, startOfDay, isBefore, isAfter } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Booking, Service } from "@/lib/db/models";

const OPEN_HOUR = 9;
const CLOSE_HOUR = 21; // Allow slots up to 9pm for evening appointments
const SLOT_STEP_MIN = 30;
const BUFFER_MIN = 30; // Minimum break between appointments

export async function getAvailableSlots(serviceId: string, dayIso: string) {
  await connectDb();
  const service = await Service.findById(serviceId);
  if (!service || !service.active) {
    throw new Error("Service not found");
  }

  // Parse as local midnight — new Date("YYYY-MM-DD") is treated as UTC midnight
  // which shifts the day backward in negative-offset timezones (e.g. MDT = UTC-6).
  const [yyyy, mm, dd] = dayIso.split("-").map(Number);
  const day = startOfDay(new Date(yyyy, mm - 1, dd)); // local time
  const dayEnd = addMinutes(day, 24 * 60);

  const existing = await Booking.find({
    start: { $lt: dayEnd },
    end: { $gt: day },
    status: { $in: ["held", "confirmed"] },
  }).select("start end holdExpiresAt status");

  const now = new Date();
  const blocking = existing.filter((b) => {
    if (b.status === "confirmed") return true;
    if (b.status === "held") {
      return !b.holdExpiresAt || isAfter(b.holdExpiresAt, now);
    }
    return false;
  });

  const slots: { start: string; end: string }[] = [];
  let cursor = setMinutes(setHours(day, OPEN_HOUR), 0);
  const close = setMinutes(setHours(day, CLOSE_HOUR), 0);

  while (true) {
    const proposedEnd = addMinutes(cursor, service.durationMin);
    // Must finish before close
    if (isAfter(proposedEnd, close)) break;

    if (!isBefore(cursor, now)) {
      // A slot is only available if:
      // 1. The new appointment window (cursor → proposedEnd) does not overlap any existing booking
      // 2. The new appointment does not start within the 30-min buffer zone after any existing booking
      //    i.e., cursor < existingBooking.end + BUFFER_MIN AND proposedEnd > existingBooking.start
      const overlaps = blocking.some((b) => {
        const bufferedEnd = addMinutes(new Date(b.end), BUFFER_MIN);
        return cursor < bufferedEnd && proposedEnd > new Date(b.start);
      });

      if (!overlaps) {
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
  excludeBookingId?: string,
) {
  await connectDb();
  const now = new Date();

  // Expand the conflict window to include the 30-min buffer after each existing booking
  // We query for bookings whose (start - BUFFER_MIN) to end overlaps the new slot
  const bufferedStart = addMinutes(start, -BUFFER_MIN);
  const query: Record<string, unknown> = {
    // An existing booking conflicts if its end + buffer overlaps the new start
    // OR the new appointment overlaps the existing booking window
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

  // Now check more precisely: does the new slot land in the buffer zone of any existing booking?
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
