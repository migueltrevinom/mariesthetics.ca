import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { StudioCharge } from "@/lib/db/models";
import {
  MAX_TIP_CHANGES,
  isTipPercent,
  openCheckoutForCharge,
  publicStudioCharge,
  tipCentsFor,
} from "@/lib/payments/studioCharge";
import { verifyStudioChargeToken } from "@/lib/payments/studioChargeToken";

const bodySchema = z.object({
  token: z.string().min(1),
  tipPercent: z.number().int(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const chargeId = await verifyStudioChargeToken(body.token);
  if (!chargeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isTipPercent(body.tipPercent)) {
    return NextResponse.json({ error: "Choose 10%, 15%, 20%, or no tip" }, { status: 400 });
  }

  try {
    await connectDb();
    const existing = await StudioCharge.findById(chargeId).lean();
    if (!existing || existing.status !== "open" || existing.paidAt) {
      return NextResponse.json({ error: "This charge is no longer open" }, { status: 409 });
    }
    if (existing.tipPercent === body.tipPercent) {
      return NextResponse.json({ charge: publicStudioCharge(existing) });
    }

    // Atomic rate limit: only open, unpaid charges with remaining tip changes are updated.
    const tipCents = tipCentsFor(existing.baseAmountCents, body.tipPercent);
    const updated = await StudioCharge.findOneAndUpdate(
      { _id: chargeId, status: "open", paidAt: null, tipChanges: { $lt: MAX_TIP_CHANGES } },
      {
        $set: { tipPercent: body.tipPercent, tipCents, totalCents: existing.baseAmountCents + tipCents },
        $inc: { tipChanges: 1 },
      },
      { new: true },
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Too many tip changes. Please ask Mari Esthetics for help." },
        { status: 429 },
      );
    }

    const ready = await openCheckoutForCharge(chargeId, req);
    return NextResponse.json({ charge: publicStudioCharge(ready) });
  } catch (err: unknown) {
    console.error("[Studio charge tip]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to update tip" }, { status: 500 });
  }
}
