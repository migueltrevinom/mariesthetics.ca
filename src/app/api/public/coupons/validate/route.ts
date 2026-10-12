import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { Coupon, GiftCard, Service } from "@/lib/db/models";
import { mapCouponDocToRecord, validateCouponForBooking } from "@/lib/couponEligibility";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.toUpperCase().trim();
    const serviceId = searchParams.get("serviceId")?.trim() || "";
    const email = searchParams.get("email")?.toLowerCase().trim() || "";

    if (!code) {
      return NextResponse.json({ error: "Coupon or gift card code is required" }, { status: 400 });
    }

    await connectDb();

    const coupon = await Coupon.findOne({ code, active: true });
    if (coupon) {
      let serviceCategory = "";
      if (serviceId) {
        const service = await Service.findById(serviceId).select("category").lean();
        serviceCategory = service ? String(service.category || "") : "";
      }

      const couponRecord = mapCouponDocToRecord(coupon.toObject());
      const eligibilityError = await validateCouponForBooking(couponRecord, {
        serviceId,
        serviceCategory,
        guestEmail: email,
      });
      if (eligibilityError) {
        return NextResponse.json({ error: eligibilityError }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        kind: "coupon",
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        firstTimeClientsOnly: Boolean(coupon.firstTimeClientsOnly),
        message: coupon.type === "percent" ? `${coupon.value}% OFF` : `$${coupon.value.toFixed(2)} CAD OFF`,
      });
    }

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Validate Promo Code Error]:", message);
    return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 });
  }
}
