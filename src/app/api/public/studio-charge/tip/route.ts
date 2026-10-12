import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { StudioCharge } from "@/lib/db/models";
import {
  isTipPercent,
  openCheckoutForCharge,
  publicStudioCharge,
  tipCentsFor,
} from "@/lib/payments/studioCharge";

const bodySchema = z.object({
  chargeId: z.string().min(1),
  tipPercent: z.number().int(),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    if (!isTipPercent(body.tipPercent)) {
      return NextResponse.json({ error: "Choose 10%, 15%, 20%, or no tip" }, { status: 400 });
    }

    await connectDb();
    const charge = await StudioCharge.findById(body.chargeId);
    if (!charge || charge.status !== "open") {
      return NextResponse.json({ error: "This charge is no longer open" }, { status: 404 });
    }

    const tipCents = tipCentsFor(charge.baseAmountCents, body.tipPercent);
    charge.tipPercent = body.tipPercent;
    charge.tipCents = tipCents;
    charge.totalCents = charge.baseAmountCents + tipCents;
    await charge.save();

    const ready = await openCheckoutForCharge(String(charge._id), req);
    return NextResponse.json({ charge: publicStudioCharge(ready) });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid tip" }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to update tip";
    console.error("[Studio charge tip]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
