import { connectDb } from "@/lib/db/connect";
import { Coupon } from "@/lib/db/models";
import {
  couponEligibilityBlockReason,
  couponRedemptionBlockReason,
  formatCouponDiscountLabel,
  formatCouponExpiryLabel,
  type CouponRecord,
} from "@/lib/coupons";
import type {
  BlogLanguage,
  BlogPromoConfig,
  BlogServiceRef,
  ResolvedBlogPromo,
} from "@/lib/blog/types";

const DEFAULT_HEADLINE =
  "Book your private appointment at Mari Esthetics in West Edmonton.";

function couponDocToRecord(doc: Record<string, unknown>): CouponRecord {
  return {
    _id: String(doc._id),
    code: String(doc.code),
    type: doc.type as "percent" | "fixed",
    value: Number(doc.value),
    active: Boolean(doc.active),
    startsAt: doc.startsAt as Date | string | null | undefined,
    expiresAt: doc.expiresAt as Date | string | null | undefined,
    maxRedemptions: doc.maxRedemptions as number | null | undefined,
    redemptionCount: Number(doc.redemptionCount ?? 0),
    firstTimeClientsOnly: Boolean(doc.firstTimeClientsOnly),
    serviceIds: Array.isArray(doc.serviceIds)
      ? doc.serviceIds.map((id) => String(id))
      : [],
    categoryIds: Array.isArray(doc.categoryIds)
      ? doc.categoryIds.map((c) => String(c))
      : [],
  };
}

function buildBookingCtaUrl(
  code: string | undefined,
  serviceIds: BlogServiceRef[],
  basePath = "/book"
): string {
  const params = new URLSearchParams();
  if (code) params.set("coupon", code);
  const primaryService = serviceIds[0]?._id;
  if (primaryService) params.set("serviceId", primaryService);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function headlineForCoupon(
  coupon: CouponRecord,
  customPromoText?: string,
  language?: BlogLanguage
): string {
  if (customPromoText?.trim()) return customPromoText.trim();
  const discount = formatCouponDiscountLabel(coupon, "long");
  if (language === "es") return `${discount} al reservar en línea.`;
  if (language === "ar") return `${discount} عند الحجز عبر الإنترنت.`;
  if (language === "tl") return `${discount} kapag nag-book online.`;
  if (language === "pa") return `ਔਨਲਾਈਨ ਬੁਕਿੰਗ 'ਤੇ ${discount}.`;
  return `${discount} when you book online.`;
}

export async function loadCouponForPromoConfig(
  promo: BlogPromoConfig
): Promise<CouponRecord | null> {
  if (!promo.enabled) return null;

  try {
    await connectDb();
    if (promo.couponId) {
      const doc = await Coupon.findById(promo.couponId).lean();
      if (!doc) return null;
      return couponDocToRecord(doc);
    }

    const legacyCode = promo.promoCode?.trim().toUpperCase();
    if (legacyCode) {
      const doc = await Coupon.findOne({ code: legacyCode }).lean();
      if (!doc) return null;
      return couponDocToRecord(doc);
    }
  } catch {
    return null;
  }

  return null;
}

export async function resolveBlogPromo(input: {
  promoConfig: BlogPromoConfig;
  serviceIds: BlogServiceRef[];
  language?: BlogLanguage;
}): Promise<ResolvedBlogPromo> {
  const promo = input.promoConfig;
  const ctaButtonText = promo.ctaButtonText?.trim() || "Book Treatment Now →";
  const baseCta = promo.ctaUrl?.trim() || "/book";

  if (!promo.enabled) {
    return {
      enabled: false,
      hasValidCoupon: false,
      headline: DEFAULT_HEADLINE,
      ctaUrl: buildBookingCtaUrl(undefined, input.serviceIds, baseCta.split("?")[0] || "/book"),
      ctaButtonText,
      eyebrow: "booking",
    };
  }

  const coupon = await loadCouponForPromoConfig(promo);
  const blogServiceIds = input.serviceIds.map((s) => s._id).filter(Boolean);
  const blockReason = coupon
    ? couponRedemptionBlockReason(coupon) ||
      couponEligibilityBlockReason(coupon, { blogServiceIds })
    : "missing";

  if (!coupon || blockReason) {
    return {
      enabled: true,
      hasValidCoupon: false,
      headline: promo.customPromoText?.trim() || DEFAULT_HEADLINE,
      ctaUrl: buildBookingCtaUrl(undefined, input.serviceIds, "/book"),
      ctaButtonText,
      eyebrow: "booking",
    };
  }

  const code = coupon.code;
  const discountLabel = formatCouponDiscountLabel(coupon, "short");
  const expiryLabel = formatCouponExpiryLabel(coupon.expiresAt);

  return {
    enabled: true,
    hasValidCoupon: true,
    code,
    discountLabel,
    expiryLabel,
    headline: headlineForCoupon(coupon, promo.customPromoText, input.language),
    ctaUrl: buildBookingCtaUrl(code, input.serviceIds, "/book"),
    ctaButtonText,
    eyebrow: "offer",
  };
}

/** Dev preview coupon (matches IQQUEEN-style fixed $20 for screenshots). */
export const PREVIEW_MOCK_COUPON: CouponRecord = {
  code: "IQQUEEN",
  type: "fixed",
  value: 20,
  active: true,
  expiresAt: new Date("2026-11-01"),
};

export function resolveBlogPromoPreview(input: {
  promoConfig: BlogPromoConfig;
  serviceIds: BlogServiceRef[];
  language?: BlogLanguage;
  mockCoupon?: CouponRecord | null;
}): ResolvedBlogPromo {
  const promo = input.promoConfig;
  const ctaButtonText = promo.ctaButtonText?.trim() || "Book Treatment Now →";

  if (!promo.enabled) {
    return {
      enabled: false,
      hasValidCoupon: false,
      headline: DEFAULT_HEADLINE,
      ctaUrl: buildBookingCtaUrl(undefined, input.serviceIds),
      ctaButtonText,
      eyebrow: "booking",
    };
  }

  const coupon = input.mockCoupon ?? null;
  if (!coupon || couponRedemptionBlockReason(coupon)) {
    return {
      enabled: true,
      hasValidCoupon: false,
      headline: promo.customPromoText?.trim() || DEFAULT_HEADLINE,
      ctaUrl: buildBookingCtaUrl(undefined, input.serviceIds),
      ctaButtonText,
      eyebrow: "booking",
    };
  }

  return {
    enabled: true,
    hasValidCoupon: true,
    code: coupon.code,
    discountLabel: formatCouponDiscountLabel(coupon, "short"),
    expiryLabel: formatCouponExpiryLabel(coupon.expiresAt),
    headline: headlineForCoupon(coupon, promo.customPromoText, input.language),
    ctaUrl: buildBookingCtaUrl(coupon.code, input.serviceIds),
    ctaButtonText,
    eyebrow: "offer",
  };
}
