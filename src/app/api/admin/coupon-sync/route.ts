import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Coupon } from "@/lib/db/models";
import { syncCouponToStripe } from "@/lib/payments/stripeCoupons";
import { withManagerAuth } from "@/lib/auth/jwt";

const syncCouponSchema = z.object({
  couponId: z.string().min(1, "Coupon ID is required"),
});

export const POST = withManagerAuth(async (req: Request) => {
  try {
    const body = await req.json();
    const { couponId } = syncCouponSchema.parse(body);

    await connectDb();
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const stripeResult = await syncCouponToStripe({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxRedemptions: coupon.maxRedemptions,
      expiresAt: coupon.expiresAt,
    });

    if (!stripeResult.stripeCouponId) {
      return NextResponse.json(
        { error: "Stripe API sync failed or returned empty ID. Ensure STRIPE_SECRET_KEY is configured." },
        { status: 400 }
      );
    }

    coupon.stripeCouponId = stripeResult.stripeCouponId;
    if (stripeResult.stripePromotionCodeId) {
      coupon.stripePromotionCodeId = stripeResult.stripePromotionCodeId;
    }
    await coupon.save();

    return NextResponse.json({
      success: true,
      coupon,
      message: `Coupon '${coupon.code}' successfully synced with Stripe!`,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("[Coupon Sync Route Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to sync coupon to Stripe" }, { status: 500 });
  }
});
