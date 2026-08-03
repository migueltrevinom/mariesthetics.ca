import { getStripe, isStripeConfigured } from "./stripe";

export interface SyncCouponParams {
  code: string;
  type: "percent" | "fixed";
  value: number; // percentage (e.g. 20) or fixed amount in CAD (e.g. 50)
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
}

export async function syncCouponToStripe(params: SyncCouponParams): Promise<{
  stripeCouponId: string;
  stripePromotionCodeId: string;
}> {
  if (!isStripeConfigured()) {
    console.warn("[Stripe Coupon Sync]: STRIPE_SECRET_KEY not set. Skipping Stripe sync.");
    return { stripeCouponId: "", stripePromotionCodeId: "" };
  }

  try {
    const stripe = getStripe();
    const cleanCode = params.code.toUpperCase().trim();

    // 1. Create Coupon in Stripe
    const couponParams: any = {
      duration: "once",
      name: `Promo Code: ${cleanCode}`,
    };

    if (params.type === "percent") {
      couponParams.percent_off = params.value;
    } else {
      couponParams.amount_off = Math.round(params.value * 100);
      couponParams.currency = "cad";
    }

    if (params.maxRedemptions && params.maxRedemptions > 0) {
      couponParams.max_redemptions = params.maxRedemptions;
    }

    if (params.expiresAt) {
      couponParams.redeem_by = Math.floor(new Date(params.expiresAt).getTime() / 1000);
    }

    const stripeCoupon = await stripe.coupons.create(couponParams);

    // 2. Create matching Promotion Code in Stripe
    const promoCodeParams: any = {
      coupon: stripeCoupon.id,
      code: cleanCode,
    };

    if (params.maxRedemptions && params.maxRedemptions > 0) {
      promoCodeParams.max_redemptions = params.maxRedemptions;
    }

    const promoCode = await stripe.promotionCodes.create(promoCodeParams);

    return {
      stripeCouponId: stripeCoupon.id,
      stripePromotionCodeId: promoCode.id,
    };
  } catch (err: any) {
    console.error("[Stripe Coupon Sync Error]:", err.message);
    return { stripeCouponId: "", stripePromotionCodeId: "" };
  }
}
