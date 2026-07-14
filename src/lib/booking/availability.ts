import { addMinutes, setHours, setMinutes, startOfDay, isBefore, isAfter } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Booking, Service } from "@/lib/db/models";

const OPEN_HOUR = 9;
const CLOSE_HOUR = 18;
const SLOT_STEP_MIN = 30;

export async function getAvailableSlots(serviceId: string, dayIso: string) {
  await connectDb();
  const service = await Service.findById(serviceId);
  if (!service || !service.active) {
    throw new Error("Service not found");
  }

  const day = startOfDay(new Date(dayIso));
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
    const end = addMinutes(cursor, service.durationMin);
    if (isAfter(end, close)) break;

    if (!isBefore(cursor, now)) {
      const overlaps = blocking.some(
        (b) => cursor < b.end && end > b.start,
      );
      if (!overlaps) {
        slots.push({ start: cursor.toISOString(), end: end.toISOString() });
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
  const query: Record<string, unknown> = {
    start: { $lt: end },
    end: { $gt: start },
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

  if (blocking.length > 0) {
    throw new Error("That time slot is no longer available");
  }
}
