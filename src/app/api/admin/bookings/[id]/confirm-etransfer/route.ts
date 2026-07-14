import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking, Payment } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";

const bodySchema = z.object({
  approve: z.boolean(),
  note: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireManager();
    const { id } = await params;
    const body = bodySchema.parse(await req.json());
    await connectDb();

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.approve) {
      booking.status = "confirmed";
      booking.holdExpiresAt = null;
      if (body.note) booking.notes = body.note;

      const deposit = await Payment.findOne({
        bookingId: booking._id,
        kind: "deposit",
        method: "etransfer",
      });

      if (deposit) {
        deposit.status = "succeeded";
        deposit.confirmedBy = session.sub as unknown as typeof deposit.confirmedBy;
        deposit.confirmedAt = new Date();
        await deposit.save();

        const summary = booking.paymentSummary ?? {
          totalCents: 0,
          depositCents: 0,
          paidCents: 0,
          tipCents: 0,
          discountCents: 0,
          balanceDueCents: 0,
        };
        summary.paidCents = (summary.paidCents ?? 0) + deposit.amountCents;
        summary.balanceDueCents = Math.max(
          0,
          (summary.totalCents ?? 0) -
            (summary.discountCents ?? 0) -
            summary.paidCents,
        );
        booking.paymentSummary = summary;
      }

      await booking.save();
      return NextResponse.json({ booking, status: "confirmed" });
    }

    booking.status = "cancelled";
    await booking.save();
    await Payment.updateMany(
      { bookingId: booking._id, status: "pending" },
      { $set: { status: "cancelled" } },
    );

    return NextResponse.json({ booking, status: "cancelled" });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to confirm e-transfer" }, { status: 500 });
  }
}
