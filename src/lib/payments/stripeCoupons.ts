import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "./stripe";

export interface SyncCouponParams {
  code: string;
  type: "percent" | "fixed";
  value: number; // percentage (e.g. 20) or fixed amount in CAD (e.g. 50)
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
}

export interface SyncCouponResult {
  stripeCouponId: string;
  stripePromotionCodeId: string;
}

function couponIdFromPromo(promo: Stripe.PromotionCode): string {
  const coupon = promo.promotion?.coupon;
  if (typeof coupon === "string") return coupon;
  if (coupon && typeof coupon === "object" && "id" in coupon) return coupon.id;
  return "";
}

function unixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Creates or reuses a Stripe coupon and promotion code.
 * Throws with the Stripe error so callers can show it. A missing secret key
 * is the only case that mentions STRIPE_SECRET_KEY.
 */
export async function syncCouponToStripe(params: SyncCouponParams): Promise<SyncCouponResult> {
  if (!isStripeConfigured()) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  const stripe = getStripe();
  const cleanCode = params.code.toUpperCase().trim();
  const expiresAt = params.expiresAt ? unixSeconds(new Date(params.expiresAt)) : undefined;
  const maxRedemptions =
    params.maxRedemptions && params.maxRedemptions > 0 ? params.maxRedemptions : undefined;

  try {
    const existingPromoCodes = await stripe.promotionCodes.list({ code: cleanCode, limit: 1 });
    const existingPromo = existingPromoCodes.data[0];
    if (existingPromo) {
      const couponId = couponIdFromPromo(existingPromo);
      if (!couponId) {
        throw new Error(`Stripe promotion code ${existingPromo.id} has no coupon id.`);
      }
      return {
        stripeCouponId: couponId,
        stripePromotionCodeId: existingPromo.id,
      };
    }

    const couponParams: Stripe.CouponCreateParams = {
      duration: "once",
      name: `Promo Code: ${cleanCode}`,
    };

    if (params.type === "percent") {
      couponParams.percent_off = params.value;
    } else {
      couponParams.amount_off = Math.round(params.value * 100);
      couponParams.currency = "cad";
    }

    if (maxRedemptions) couponParams.max_redemptions = maxRedemptions;
    if (expiresAt) couponParams.redeem_by = expiresAt;

    const stripeCoupon = await stripe.coupons.create(couponParams);

    const promoCode = await stripe.promotionCodes.create({
      promotion: {
        type: "coupon",
        coupon: stripeCoupon.id,
      },
      code: cleanCode,
      ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
      ...(expiresAt ? { expires_at: expiresAt } : {}),
    });

    return {
      stripeCouponId: stripeCoupon.id,
      stripePromotionCodeId: promoCode.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe coupon sync failed";
    console.error("[Stripe Coupon Sync Error]:", message);
    if (message === "STRIPE_SECRET_KEY is not configured." || message.startsWith("Stripe promotion code ")) {
      throw err;
    }
    throw new Error(message);
  }
}
