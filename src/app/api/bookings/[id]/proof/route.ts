import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking, Payment } from "@/lib/db/models";

const bodySchema = z.object({
  proofUrl: z.string().url().optional(),
  note: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = bodySchema.parse(await req.json());
    await connectDb();

    const booking = await Booking.findById(id);
    if (!booking || booking.status !== "held") {
      return NextResponse.json(
        { error: "Booking is not awaiting e-Transfer proof" },
        { status: 400 },
      );
    }

    if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
      booking.status = "expired";
      await booking.save();
      return NextResponse.json(
        { error: "Hold expired. Please book again." },
        { status: 400 },
      );
    }

    booking.etransferProofUrl = body.proofUrl ?? "";
    booking.etransferNote = body.note;
    await booking.save();

    await Payment.findOneAndUpdate(
      { bookingId: booking._id, kind: "deposit", method: "etransfer" },
      {
        $set: {
          proofUrl: body.proofUrl ?? "",
          note: body.note,
          status: "pending",
        },
      },
    );

    return NextResponse.json({
      ok: true,
      message: "Proof submitted. We will confirm your appointment shortly.",
      booking,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to submit proof" }, { status: 500 });
  }
}
