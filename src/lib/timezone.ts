import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

export const STUDIO_TIMEZONE = "America/Edmonton";

// Ensure Node server process defaults to Edmonton timezone
process.env.TZ = STUDIO_TIMEZONE;

/**
 * Returns formatted date components specifically evaluated in Edmonton time.
 */
export function getEdmontonDateParts(date: Date) {
  const zoned = toZonedTime(date, STUDIO_TIMEZONE);
  const year = zoned.getFullYear();
  const month = zoned.getMonth() + 1;
  const day = zoned.getDate();
  const hour = zoned.getHours();
  const minute = zoned.getMinutes();
  const dayOfWeek = zoned.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    dayOfWeek,
    isoDate,
    timeStr,
  };
}

/**
 * Creates a JS Date object from year, month, day, hour, minute in Edmonton time.
 */
export function createEdmontonDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): Date {
  const pad = (n: number) => String(n).padStart(2, "0");
  const isoLocal = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
  return fromZonedTime(isoLocal, STUDIO_TIMEZONE);
}

/**
 * Parses an ISO date string "YYYY-MM-DD" into a Date object at 00:00:00 Edmonton time.
 */
export function parseEdmontonDayIso(dayIso: string): Date {
  const [yyyy, mm, dd] = dayIso.split("-").map(Number);
  return createEdmontonDate(yyyy, mm, dd, 0, 0);
}

/**
 * Formats a Date object to "YYYY-MM-DD" in Edmonton time.
 */
export function formatEdmontonDate(date: Date): string {
  return formatInTimeZone(date, STUDIO_TIMEZONE, "yyyy-MM-dd");
}

/**
 * Formats a Date object to display time "h:mm a" in Edmonton time.
 */
export function formatEdmontonTime(date: Date): string {
  return formatInTimeZone(date, STUDIO_TIMEZONE, "h:mm a");
}

/**
 * Formats a Date object to "EEEE, MMMM d, yyyy" in Edmonton time.
 */
export function formatEdmontonFullDate(date: Date): string {
  return formatInTimeZone(date, STUDIO_TIMEZONE, "EEEE, MMMM d, yyyy");
}
