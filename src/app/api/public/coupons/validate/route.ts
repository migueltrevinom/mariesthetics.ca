import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { Coupon, GiftCard } from "@/lib/db/models";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.toUpperCase().trim();

    if (!code) {
      return NextResponse.json({ error: "Coupon or gift card code is required" }, { status: 400 });
    }

    await connectDb();

    // 1. Check Discount Coupons
    const coupon = await Coupon.findOne({ code, active: true });
    if (coupon) {
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json({ error: "Coupon code has expired" }, { status: 400 });
      }
      if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
        return NextResponse.json({ error: "Coupon code redemption limit reached" }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        kind: "coupon",
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        message: coupon.type === "percent" ? `${coupon.value}% OFF` : `$${coupon.value.toFixed(2)} CAD OFF`,
      });
    }

    // 2. Check Digital Gift Cards
    const giftCard = await GiftCard.findOne({ code, active: true });
    if (giftCard) {
      if (giftCard.expiryDate && new Date(giftCard.expiryDate) < new Date()) {
        return NextResponse.json({ error: "Gift card has expired" }, { status: 400 });
      }
      if (giftCard.remainingBalanceCents <= 0) {
        return NextResponse.json({ error: "Gift card balance is $0.00" }, { status: 400 });
      }

      const balanceCad = giftCard.remainingBalanceCents / 100;
      return NextResponse.json({
        success: true,
        kind: "gift_card",
        code: giftCard.code,
        type: "fixed",
        value: balanceCad,
        remainingBalanceCents: giftCard.remainingBalanceCents,
        message: `Gift Voucher Balance: $${balanceCad.toFixed(2)} CAD`,
      });
    }

    return NextResponse.json({ error: "Invalid coupon or gift card code" }, { status: 404 });
  } catch (err: any) {
    console.error("[Validate Promo Code Error]:", err.message);
    return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 });
  }
}
