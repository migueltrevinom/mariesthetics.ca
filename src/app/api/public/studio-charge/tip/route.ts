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
    const tipCents = tipCentsFor(existing.baseAmountCents, body.tipPercent);
    const updated = await StudioCharge.findOneAndUpdate(
      { _id: chargeId, status: "open", paidAt: null },
      {
        $set: { tipPercent: body.tipPercent, tipCents, totalCents: existing.baseAmountCents + tipCents },
      },
      { new: true },
    );
    if (!updated) {
      return NextResponse.json(
        { error: "This charge is no longer open" },
        { status: 409 },
      );
    }

    const ready = await openCheckoutForCharge(chargeId, req);
    return NextResponse.json({
      checkoutUrl: ready.checkoutUrl,
      charge: publicStudioCharge(ready),
    });
  } catch (err: unknown) {
    console.error("[Studio charge tip]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to update tip" }, { status: 500 });
  }
}
