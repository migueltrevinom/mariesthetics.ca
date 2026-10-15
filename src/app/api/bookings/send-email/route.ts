import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyClientOfBooking } from "@/lib/mailgun/notifications";

const bodySchema = z.object({
  bookingId: z.string().min(1),
  email: z.string().email().optional(),
  kind: z.enum(["deposit", "balance", "tip", "custom"]).optional(),
  amountCents: z.number().int().nonnegative().optional(),
});

export async function POST(req: Request) {
  try {
    const { bookingId, email: overrideEmail, kind, amountCents } =
      bodySchema.parse(await req.json());

    const result = await notifyClientOfBooking({
      bookingId,
      recipientEmail: overrideEmail,
      kind,
      chargeCents: amountCents,
      force: true,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to deliver email" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Booking confirmation email sent`,
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
