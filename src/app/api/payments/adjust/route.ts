import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking, Payment } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";

const bodySchema = z.object({
  bookingId: z.string().min(1),
  amountCents: z.number().int(),
  method: z.enum(["cash", "etransfer", "stripe"]),
  note: z.string().optional(),
  markSucceeded: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    const session = await requireManager();
    const body = bodySchema.parse(await req.json());
    await connectDb();

    const booking = await Booking.findById(body.bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const payment = await Payment.create({
      bookingId: booking._id,
      kind: "adjustment",
      method: body.method,
      amountCents: body.amountCents,
      status: body.markSucceeded ? "succeeded" : "pending",
      note: body.note ?? "",
      confirmedBy: session.sub,
      confirmedAt: body.markSucceeded ? new Date() : null,
    });

    if (body.markSucceeded) {
      const summary = booking.paymentSummary ?? {
        totalCents: 0,
        depositCents: 0,
        paidCents: 0,
        tipCents: 0,
        discountCents: 0,
        balanceDueCents: 0,
      };
      summary.paidCents = (summary.paidCents ?? 0) + body.amountCents;
      summary.balanceDueCents = Math.max(
        0,
        (summary.totalCents ?? 0) -
          (summary.discountCents ?? 0) -
          summary.paidCents,
      );
      booking.paymentSummary = summary;
      await booking.save();
    }

    return NextResponse.json({ payment, booking });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to record adjustment" }, { status: 500 });
  }
}
