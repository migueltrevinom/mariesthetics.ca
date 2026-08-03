import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireManager } from "@/lib/auth/jwt";
import { ReviewRepository } from "@/app/api/admin/reviews/repositories/review.repository";
import { sendEmail } from "@/lib/mailgun";
import { config } from "@/lib/config";
import { format } from "date-fns";

const bodySchema = z.object({
  bookingId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    await requireManager();
    const body = bodySchema.parse(await req.json());

    const review = await ReviewRepository.findOrCreateTokenForBooking(body.bookingId);

    const guestEmail = review.guest?.email;
    if (!guestEmail) {
      return NextResponse.json({ error: "Guest email is missing on this booking" }, { status: 400 });
    }

    const reviewUrl = `${config.appUrl}/review?token=${review.token}`;
    const guestName = review.guest?.name || "Valued Client";
    const serviceName = (review.serviceId as any)?.name || "Esthetics Treatment";

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #faf9f6; padding: 32px; border-radius: 16px; border: 1px solid #e8e3d9; color: #24180a;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #c8a86b; font-size: 24px; margin: 0;">Mari Esthetics Studio</h2>
          <p style="color: #665b4e; font-size: 13px; margin-top: 4px;">Edmonton, Alberta</p>
        </div>

        <div style="background: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #eae5db;">
          <h3 style="margin-top: 0; color: #24180a;">How was your experience, ${guestName}? ✨</h3>
          <p style="color: #4a4035; line-height: 1.6; font-size: 14px;">
            Thank you for visiting Mari Esthetics Studio for your <strong>${serviceName}</strong>. Your satisfaction and feedback mean the world to us.
          </p>

          <p style="color: #4a4035; line-height: 1.6; font-size: 14px;">
            Would you take 60 seconds to share your experience with us?
          </p>

          <div style="text-align: center; margin: 32px 0 20px 0;">
            <a href="${reviewUrl}" style="background-color: #2f5d4a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(47,93,74,0.2);">
              ⭐ Leave a 60-Sec Review →
            </a>
          </div>

          <p style="text-align: center; font-size: 11px; color: #887d70; margin-top: 16px; word-break: break-all;">
            Direct link: <a href="${reviewUrl}" style="color: #c8a86b;">${reviewUrl}</a>
          </p>
        </div>

        <p style="text-align: center; font-size: 11px; color: #887d70; margin-top: 24px;">
          Mari Esthetics · Edmonton, AB · Thank you for choosing us!
        </p>
      </div>
    `;

    await sendEmail({
      to: guestEmail,
      subject: `How was your ${serviceName} at Mari Esthetics? ✨`,
      html,
    });

    return NextResponse.json({
      success: true,
      message: `Review request sent to ${guestEmail}`,
      reviewUrl,
      token: review.token,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error("[Review Request Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to send review request" }, { status: 500 });
  }
}
