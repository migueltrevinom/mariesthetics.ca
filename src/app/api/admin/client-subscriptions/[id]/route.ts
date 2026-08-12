import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { ClientSubscription } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";

const updateSchema = z.object({
  status: z.enum(["active", "past_due", "cancelled", "paused"]).optional(),
  visitsUsedThisPeriod: z.number().min(0).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());
    await connectDb();

    const subscription = await ClientSubscription.findByIdAndUpdate(id, body, { new: true })
      .populate("clientId", "name email phone")
      .populate("planId");

    if (!subscription) {
      return NextResponse.json({ error: "Client subscription not found" }, { status: 404 });
    }

    return NextResponse.json({ subscription });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update client subscription" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();
    const { id } = await params;
    await connectDb();

    const deleted = await ClientSubscription.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Client subscription not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to delete client subscription" }, { status: 500 });
  }
}
