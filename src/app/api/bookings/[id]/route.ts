import { NextResponse } from "next/server";
import { format } from "date-fns";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking, Service } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";
import { assertSlotFree } from "@/lib/booking/availability";
import { notifyAdminsOfBooking } from "@/lib/mailgun/notifications";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";
import { config } from "@/lib/config";

const patchSchema = z.object({
  status: z.enum(["held", "confirmed", "cancelled", "completed", "expired"]).optional(),
  notes: z.string().optional(),
  start: z.string().datetime().optional(),
  allowLateReschedule: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectDb();
    const booking = await Booking.findById(id).populate("serviceId");
    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ booking });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load booking" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireManager();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    await connectDb();

    const existingBooking = await Booking.findById(id).populate("serviceId");
    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updates: any = {};
    let isRescheduled = false;

    if (body.status) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.allowLateReschedule !== undefined) updates.allowLateReschedule = body.allowLateReschedule;

    if (body.start) {
      const newStart = new Date(body.start);
      const service = await Service.findById(existingBooking.serviceId?._id || existingBooking.serviceId);
      const durationMin = service?.durationMin || 60;
      const newEnd = new Date(newStart.getTime() + durationMin * 60_000);

      // Conflict checking ignoring current booking
      await assertSlotFree(newStart, newEnd, id);

      updates.start = newStart;
      updates.end = newEnd;
      // Reset reminder flags on reschedule
      updates.reminder24hSent = false;
      updates.reminder2hSent = false;
      isRescheduled = true;
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true },
    ).populate("serviceId");

    if (isRescheduled && booking) {
      // Trigger Mailgun updated appointment notification
      void notifyAdminsOfBooking({
        bookingId: String(booking._id),
        eventType: "rescheduled",
      });

      // Dispatch Twilio SMS notification to client
      if (isTwilioConfigured() && booking.guest?.phone) {
        const name = booking.guest?.name || "Valued Client";
        const serviceName = (booking.serviceId as any)?.name || "Esthetics Treatment";
        const dateFormatted = format(new Date(booking.start), "EEE, MMM d");
        const timeFormatted = format(new Date(booking.start), "h:mm a");

        const smsBody = `✨ Hi ${name}! Your ${serviceName} at Mari Esthetics has been rescheduled to ${dateFormatted} at ${timeFormatted}.\n\nStudio Address: 1211 Gillespie Cres NW, Edmonton, AB.\nView booking: ${config.appUrl}/payment-link`;

        void sendSms({
          countryCode: booking.guest.countryCode || "+1",
          phone: booking.guest.phone,
          body: smsBody,
        });
      }
    }

    return NextResponse.json({ booking });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error("[PATCH Booking Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to update booking" }, { status: 400 });
  }
}
