import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { StudioCharge } from "@/lib/db/models";
import { withManagerAuth } from "@/lib/auth/jwt";
import { isStripeConfigured } from "@/lib/payments/stripe";
import { getAppUrl } from "@/lib/config";
import { signStudioChargeToken } from "@/lib/payments/studioChargeToken";
import {
  cancelOpenStudioCharges,
  openCheckoutForCharge,
  tipCentsFor,
} from "@/lib/payments/studioCharge";

const bodySchema = z.object({
  amountCad: z.number().positive(),
  clientName: z.string().optional().default(""),
  clientEmail: z.string().email(),
  description: z.string().optional().default(""),
});

async function payUrlFor(chargeId: string, req: Request) {
  return `${getAppUrl(req)}/pay?t=${encodeURIComponent(await signStudioChargeToken(chargeId))}`;
}

function adminStudioCharge(charge: {
  _id: unknown;
  baseAmountCents: number;
  tipPercent: number;
  tipCents: number;
  totalCents: number;
  clientName?: string;
  clientEmail?: string;
  description?: string;
  status: string;
  paidAt?: Date | null;
  createdAt?: Date;
}) {
  return {
    id: String(charge._id),
    clientName: charge.clientName || "",
    clientEmail: charge.clientEmail || "",
    description: charge.description || "Mari Esthetics",
    status: charge.status,
    baseAmountCents: charge.baseAmountCents,
    tipPercent: charge.tipPercent,
    tipCents: charge.tipCents,
    totalCents: charge.totalCents,
    paidAt: charge.paidAt ? new Date(charge.paidAt).toISOString() : null,
    createdAt: charge.createdAt ? new Date(charge.createdAt).toISOString() : null,
  };
}

export const GET = withManagerAuth(async (req: Request) => {
  try {
    await connectDb();
    const charges = await StudioCharge.find({ status: { $in: ["open", "paid", "cancelled"] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const rows = await Promise.all(
      charges.map(async (charge) => ({
        ...adminStudioCharge(charge),
        payUrl: charge.status === "open" ? await payUrlFor(String(charge._id), req) : "",
      })),
    );
    return NextResponse.json({ charges: rows });
  } catch (err) {
    console.error("[Studio charge list]", err);
    return NextResponse.json({ error: "Failed to load charges" }, { status: 500 });
  }
});

export const POST = withManagerAuth(async (req: Request) => {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const body = bodySchema.parse(await req.json());
    const baseAmountCents = Math.round(body.amountCad * 100);
    if (baseAmountCents < 50) {
      return NextResponse.json({ error: "Amount must be at least $0.50" }, { status: 400 });
    }

    await connectDb();
    await cancelOpenStudioCharges();

    const tipPercent = 10;
    const tipCents = tipCentsFor(baseAmountCents, tipPercent);
    const charge = await StudioCharge.create({
      baseAmountCents,
      tipPercent,
      tipCents,
      totalCents: baseAmountCents + tipCents,
      clientName: body.clientName.trim(),
      clientEmail: body.clientEmail.toLowerCase().trim(),
      description: body.description.trim() || "Mari Esthetics",
      status: "open",
    });

    const ready = await openCheckoutForCharge(String(charge._id), req);
    return NextResponse.json({
      success: true,
      charge: { ...adminStudioCharge(ready), payUrl: await payUrlFor(String(ready._id), req) },
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid charge" }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to start charge";
    console.error("[Studio charge create]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
