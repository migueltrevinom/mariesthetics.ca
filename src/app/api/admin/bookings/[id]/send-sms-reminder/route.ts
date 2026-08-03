import { NextResponse } from "next/server";
import { format } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Booking } from "@/lib/db/models/Booking";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";
import { withManagerAuth } from "@/lib/auth/jwt";
import { config } from "@/lib/config";
import "@/lib/db/models/Service";

export const POST = withManagerAuth(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;
      await connectDb();

      const booking = await Booking.findById(id).populate("serviceId");
      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const phone = booking.guest?.phone;
      if (!phone) {
        return NextResponse.json({ error: "Client phone number is missing on this booking" }, { status: 400 });
      }

      if (!isTwilioConfigured()) {
        return NextResponse.json({ error: "Twilio credentials are not configured in environment variables" }, { status: 400 });
      }

      const name = booking.guest?.name || "Valued Client";
      const serviceName = (booking.serviceId as any)?.name || "Esthetics Treatment";
      const dateFormatted = format(new Date(booking.start), "EEE, MMM d");
      const timeFormatted = format(new Date(booking.start), "h:mm a");

      const message = `✨ Hi ${name}! Reminder for your ${serviceName} at Mari Esthetics on ${dateFormatted} at ${timeFormatted}.\n\nStudio Address: 1211 Gillespie Cres NW, Edmonton, AB.\nSee details: ${config.appUrl}/payment-link`;

      const smsRes = await sendSms({ to: phone, body: message });
      if (!smsRes.success) {
        return NextResponse.json({ error: smsRes.error || "Failed to send SMS" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Instant SMS reminder sent to ${phone}`,
        messageId: smsRes.messageId,
      });
    } catch (err: any) {
      console.error("[Manual Send SMS Error]:", err.message);
      return NextResponse.json({ error: err.message || "Failed to send SMS reminder" }, { status: 500 });
    }
  }
);
