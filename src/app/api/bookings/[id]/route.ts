import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { Booking } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed", "expired"]).optional(),
  notes: z.string().optional(),
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

    const booking = await Booking.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true },
    ).populate("serviceId");

    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ booking });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
