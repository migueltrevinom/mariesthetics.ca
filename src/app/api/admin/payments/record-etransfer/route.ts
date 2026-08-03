import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking, Payment } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";

const bodySchema = z.object({
  amountCad: z.number().positive(),
  referenceNumber: z.string().optional().default(""),
  bookingId: z.string().optional().default(""),
  kind: z.enum(["deposit", "balance", "tip", "adjustment"]).default("balance"),
  note: z.string().optional().default(""),
  clientEmail: z.string().optional().default(""),
  clientName: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const manager = await requireManager();
    const body = bodySchema.parse(await req.json());
    await connectDb();

    const amountCents = Math.round(body.amountCad * 100);

    let booking: any = null;
    if (body.bookingId) {
      booking = await Booking.findById(body.bookingId);
    }

    const payment = await Payment.create({
      bookingId: booking ? booking._id : undefined,
      kind: body.kind,
      method: "etransfer",
      amountCents,
      status: "succeeded",
      referenceNumber: body.referenceNumber,
      note: body.note || `Manual e-Transfer recorded by ${manager.email}`,
      confirmedBy: manager.sub ? manager.sub : undefined,
      confirmedAt: new Date(),
    });

    if (booking) {
      const summary = booking.paymentSummary ?? {
        totalCents: 0,
        depositCents: 0,
        paidCents: 0,
        tipCents: 0,
        discountCents: 0,
        balanceDueCents: 0,
      };

      if (body.kind === "tip") {
        summary.tipCents = (summary.tipCents ?? 0) + amountCents;
      } else {
        summary.paidCents = (summary.paidCents ?? 0) + amountCents;
        summary.balanceDueCents = Math.max(
          0,
          (summary.totalCents ?? 0) - (summary.discountCents ?? 0) - summary.paidCents
        );
      }

      booking.paymentSummary = summary;
      if (booking.status === "held") {
        booking.status = "confirmed";
        booking.holdExpiresAt = null;
      }
      await booking.save();
    }

    return NextResponse.json({ success: true, payment });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error("[Record e-Transfer Error]:", err);
    return NextResponse.json({ error: "Failed to record manual e-Transfer" }, { status: 500 });
  }
}
