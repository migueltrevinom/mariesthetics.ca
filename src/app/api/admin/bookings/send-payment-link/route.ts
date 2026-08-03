import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";
import { formatCad } from "@/lib/money";
import { sendEmail } from "@/lib/mailgun";
import { format } from "date-fns";

const bodySchema = z.object({
  bookingId: z.string().min(1),
  paymentUrl: z.string().url(),
});

export async function POST(req: Request) {
  try {
    await requireManager();
    const body = bodySchema.parse(await req.json());
    await connectDb();

    const booking = await Booking.findById(body.bookingId).populate("serviceId");
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const guestEmail = booking.guest?.email;
    if (!guestEmail) {
      return NextResponse.json({ error: "Guest email is missing on this booking" }, { status: 400 });
    }

    const guestName = booking.guest?.name || "Valued Client";
    const serviceName = (booking.serviceId as any)?.name || "Esthetics Treatment";
    const amountCents = booking.paymentSummary?.balanceDueCents || 0;
    const amountFormatted = formatCad(amountCents);
    const startDate = new Date(booking.start);
    const appointmentDate = format(startDate, "EEEE, MMMM d, yyyy 'at' h:mm a");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #faf9f6; padding: 30px; border-radius: 16px; border: 1px solid #e8e3d9; color: #24180a;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #c8a86b; font-size: 24px; margin: 0;">Mari Esthetics Studio</h2>
          <p style="color: #665b4e; font-size: 13px; margin-top: 4px;">Edmonton, Alberta</p>
        </div>

        <div style="background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #eae5db;">
          <h3 style="margin-top: 0; color: #24180a;">Hello ${guestName},</h3>
          <p style="color: #4a4035; line-height: 1.6; font-size: 14px;">
            Here is your secure payment link to pay the remaining balance for your upcoming <strong>${serviceName}</strong> appointment.
          </p>

          <div style="background: #f7f4ee; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Appointment Scheduled:</strong> ${appointmentDate}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Remaining Balance:</strong> <span style="color: #856526; font-weight: bold; font-size: 16px;">${amountFormatted}</span></p>
          </div>

          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${body.paymentUrl}" style="background-color: #2f5d4a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
              💳 Pay Remaining Balance (${amountFormatted}) →
            </a>
          </div>
        </div>

        <p style="text-align: center; font-size: 11px; color: #887d70; margin-top: 24px;">
          Mari Esthetics · Edmonton, AB · Thank you for choosing us!
        </p>
      </div>
    `;

    await sendEmail({
      to: guestEmail,
      subject: `Payment Link for Your Mari Esthetics Appointment (${amountFormatted})`,
      html,
    });

    return NextResponse.json({ success: true, message: `Payment link emailed to ${guestEmail}` });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error("[SendPaymentLink Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to send payment link email" }, { status: 500 });
  }
}
