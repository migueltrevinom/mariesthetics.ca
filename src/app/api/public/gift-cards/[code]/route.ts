import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { GiftCard } from "@/lib/db/models/GiftCard";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: "Gift card code is required" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();
    await connectDb();

    const giftCard = await GiftCard.findOne({ code: cleanCode, active: true }).lean();

    if (!giftCard) {
      return NextResponse.json({ error: "Gift certificate not found or inactive" }, { status: 404 });
    }

    const isExpired = giftCard.expiryDate ? new Date(giftCard.expiryDate) < new Date() : false;

    return NextResponse.json({
      success: true,
      giftCard: {
        code: giftCard.code,
        initialBalanceCents: giftCard.initialBalanceCents,
        remainingBalanceCents: giftCard.remainingBalanceCents,
        amountCad: giftCard.remainingBalanceCents / 100,
        initialAmountCad: giftCard.initialBalanceCents / 100,
        recipientName: giftCard.recipientName || "Valued Client",
        senderName: giftCard.senderName || "Mari Esthetics Studio",
        message: giftCard.message || "",
        expiryDate: giftCard.expiryDate || null,
        isExpired,
        createdAt: giftCard.createdAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[Get Public Gift Card Error]:", message);
    return NextResponse.json({ error: "Failed to load gift certificate" }, { status: 500 });
  }
}
