import { NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Booking } from "@/lib/db/models";
import { formatCad } from "@/lib/money";
import { config } from "@/lib/config";
import { generateIcsContent } from "@/lib/calendar/ics";
import { sendEmail } from "@/lib/mailgun";

const bodySchema = z.object({
  bookingId: z.string().min(1),
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  try {
    const { bookingId, email: overrideEmail } = bodySchema.parse(await req.json());
    await connectDb();

    const booking = await Booking.findById(bookingId).populate("serviceId");
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const recipientEmail = overrideEmail || booking.guest?.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: "Recipient email is missing" }, { status: 400 });
    }

    const serviceObj = booking.serviceId as any;
    const serviceName = serviceObj?.name || "Esthetics Service";
    const durationMin = serviceObj?.durationMin || 60;

    const startDate = new Date(booking.start);
    const endDate = new Date(booking.end || startDate.getTime() + durationMin * 60_000);

    const formattedDate = format(startDate, "EEEE, MMMM d, yyyy");
    const formattedTime = format(startDate, "h:mm a");

    const summary = booking.paymentSummary || {};
    const totalFormatted = formatCad(summary.totalCents || serviceObj?.priceCents || 0);
    const depositPaidFormatted = formatCad(summary.depositCents || summary.paidCents || 0);
    const balanceDueFormatted = formatCad(summary.balanceDueCents || 0);

    const studioAddress = config.studioAddress;

    // Generate iCal .ics file content
    const icsContent = generateIcsContent({
      title: `Mari Esthetics — ${serviceName}`,
      description: `Appointment for ${serviceName} at Mari Esthetics.\n\nDeposit Paid: ${depositPaidFormatted}\nBalance Due at Studio: ${balanceDueFormatted}\nClient: ${booking.guest?.name || ""}`,
      location: studioAddress,
      start: startDate,
      end: endDate,
      organizerName: "Mari Esthetics",
      organizerEmail: "mari@mariesthetics.ca",
    });

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: `Appointment Confirmed: ${serviceName} on ${formattedDate}`,
      templateName: "booking-confirmation",
      data: {
        clientName: booking.guest?.name || "Valued Client",
        serviceName,
        formattedDate,
        formattedTime,
        durationMin,
        studioAddress,
        totalFormatted,
        depositPaidFormatted,
        balanceDueFormatted,
      },
      attachment: {
        filename: "appointment.ics",
        content: icsContent,
        contentType: "text/calendar",
      },
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Failed to deliver email");
    }

    return NextResponse.json({
      success: true,
      message: `Booking confirmation email sent to ${recipientEmail}`,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error("[Send Booking Email Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send confirmation email" },
      { status: 500 }
    );
  }
}
