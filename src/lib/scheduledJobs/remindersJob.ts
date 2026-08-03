import { addHours, format } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Booking } from "@/lib/db/models/Booking";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";
import { config } from "@/lib/config";
import "@/lib/db/models/Service";

export interface ScheduledJobResult {
  jobName: string;
  timestamp: string;
  processedCount: number;
  remindersSent24h: number;
  remindersSent2h: number;
  errors: string[];
}

/**
 * Scheduled Job: Scans upcoming appointments and dispatches 24h & 2h SMS reminders.
 */
export async function runAppointmentRemindersJob(): Promise<ScheduledJobResult> {
  const jobName = "Appointment SMS Reminders Job";
  const now = new Date();
  const timestamp = now.toISOString();

  const result: ScheduledJobResult = {
    jobName,
    timestamp,
    processedCount: 0,
    remindersSent24h: 0,
    remindersSent2h: 0,
    errors: [],
  };

  if (!isTwilioConfigured()) {
    result.errors.push("Twilio is not configured in environment variables.");
    return result;
  }

  await connectDb();

  // 1. 24-HOUR REMINDERS (Bookings starting between 23h and 25h from now)
  const window24hStart = addHours(now, 23);
  const window24hEnd = addHours(now, 25);

  const bookings24h = await Booking.find({
    start: { $gte: window24hStart, $lte: window24hEnd },
    status: { $in: ["confirmed", "held"] },
    reminder24hSent: { $ne: true },
  }).populate("serviceId");

  for (const booking of bookings24h) {
    result.processedCount++;
    const countryCode = booking.guest?.countryCode || "+1";
    const phone = booking.guest?.phone;
    const name = booking.guest?.name || "Valued Client";
    const serviceName = (booking.serviceId as any)?.name || "Esthetics Treatment";
    const dateFormatted = format(new Date(booking.start), "EEE, MMM d");
    const timeFormatted = format(new Date(booking.start), "h:mm a");

    if (!phone) {
      continue;
    }

    const message = `✨ Hi ${name}! Reminder for your ${serviceName} at Mari Esthetics on ${dateFormatted} at ${timeFormatted}.\n\nStudio Address: 1211 Gillespie Cres NW, Edmonton, AB.\nSee booking: ${config.appUrl}/payment-link`;

    const smsRes = await sendSms({ countryCode, phone, body: message });
    if (smsRes.success) {
      result.remindersSent24h++;
      booking.reminder24hSent = true;
      await booking.save();
    } else {
      result.errors.push(`Failed 24h SMS to ${phone} for booking ${booking._id}: ${smsRes.error}`);
    }
  }

  // 2. 2-HOUR REMINDERS (Bookings starting between 1.5h and 2.5h from now)
  const window2hStart = addHours(now, 1.5);
  const window2hEnd = addHours(now, 2.5);

  const bookings2h = await Booking.find({
    start: { $gte: window2hStart, $lte: window2hEnd },
    status: { $in: ["confirmed", "held"] },
    reminder2hSent: { $ne: true },
  }).populate("serviceId");

  for (const booking of bookings2h) {
    result.processedCount++;
    const countryCode = booking.guest?.countryCode || "+1";
    const phone = booking.guest?.phone;
    const name = booking.guest?.name || "Valued Client";
    const serviceName = (booking.serviceId as any)?.name || "Esthetics Treatment";
    const timeFormatted = format(new Date(booking.start), "h:mm a");

    if (!phone) {
      continue;
    }

    const message = `⏱️ Hi ${name}! Your ${serviceName} at Mari Esthetics starts in 2 hours (${timeFormatted}).\n\nStudio Address: 1211 Gillespie Cres NW, Edmonton, AB.\nSee you soon!`;

    const smsRes = await sendSms({ countryCode, phone, body: message });
    if (smsRes.success) {
      result.remindersSent2h++;
      booking.reminder2hSent = true;
      await booking.save();
    } else {
      result.errors.push(`Failed 2h SMS to ${phone} for booking ${booking._id}: ${smsRes.error}`);
    }
  }

  return result;
}
