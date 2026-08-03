import { NextResponse } from "next/server";
import { format, differenceInHours } from "date-fns";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking, Service } from "@/lib/db/models";
import { assertSlotFree } from "@/lib/booking/availability";
import { notifyAdminsOfBooking } from "@/lib/mailgun/notifications";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

const rescheduleSchema = z.object({
  newStart: z.string().datetime(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = rescheduleSchema.parse(await req.json());
    await connectDb();

    const booking = await Booking.findById(id).populate("serviceId");
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      return NextResponse.json(
        { error: `Cannot reschedule a ${booking.status} appointment.` },
        { status: 400 }
      );
    }

    // 24-HOUR RESCHEDULE POLICY ENFORCEMENT
    const now = new Date();
    const hoursUntilAppointment = differenceInHours(new Date(booking.start), now);

    if (hoursUntilAppointment < 24) {
      return NextResponse.json(
        {
          error:
            "⚠️ Rescheduling within 24 hours of your appointment forfeits your deposit per studio policy. To select a new time slot, please place a new booking deposit.",
          policyTriggered: "under_24h",
        },
        { status: 400 }
      );
    }

    // Validate new slot availability & buffer time
    const newStart = new Date(body.newStart);
    const service = await Service.findById(booking.serviceId?._id || booking.serviceId);
    const durationMin = service?.durationMin || 60;
    const newEnd = new Date(newStart.getTime() + durationMin * 60_000);

    await assertSlotFree(newStart, newEnd, id);

    // Update appointment
    booking.start = newStart;
    booking.end = newEnd;
    booking.reminder24hSent = false;
    booking.reminder2hSent = false;
    await booking.save();

    // Trigger Mailgun updated email notification
    void notifyAdminsOfBooking({
      bookingId: String(booking._id),
      eventType: "rescheduled",
    });

    // Trigger Twilio SMS confirmation to client
    if (isTwilioConfigured() && booking.guest?.phone) {
      const name = booking.guest?.name || "Valued Client";
      const serviceName = service?.name || "Esthetics Treatment";
      const dateFormatted = format(new Date(booking.start), "EEE, MMM d");
      const timeFormatted = format(new Date(booking.start), "h:mm a");

      const smsBody = `✨ Hi ${name}! Your ${serviceName} at Mari Esthetics has been successfully rescheduled to ${dateFormatted} at ${timeFormatted}.\n\nStudio Address: 1211 Gillespie Cres NW, Edmonton, AB.\nView booking: ${config.appUrl}/payment-link`;

      void sendSms({
        countryCode: booking.guest.countryCode || "+1",
        phone: booking.guest.phone,
        body: smsBody,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Appointment rescheduled successfully!",
      booking,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error("[Public Reschedule Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to reschedule appointment" }, { status: 400 });
  }
}
