import { createEdmontonDate, formatEdmontonFullDate } from "@/lib/timezone";

/** Interpret a YYYY-MM-DD value as the start or end of that day in Edmonton. */
export function parseCouponDay(dayIso: string | null | undefined, edge: "start" | "end"): Date | null {
  if (!dayIso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dayIso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  if (edge === "start") return createEdmontonDate(year, month, day, 0, 0);
  return createEdmontonDate(year, month, day, 23, 59);
}

export function couponAvailabilityError(
  coupon: { startsAt?: Date | string | null; expiresAt?: Date | string | null },
  now = new Date(),
): string | null {
  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return `This coupon is not active until ${formatEdmontonFullDate(new Date(coupon.startsAt))}`;
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return "This coupon has expired";
  }
  return null;
}

export type CouponRecord = {
  _id?: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  active?: boolean;
  startsAt?: Date | string | null;
  expiresAt?: Date | string | null;
  maxRedemptions?: number | null;
  redemptionCount?: number;
  firstTimeClientsOnly?: boolean;
  serviceIds?: string[];
  categoryIds?: string[];
};

export type CouponEligibilityContext = {
  serviceId?: string;
  serviceCategory?: string;
  /** Guest email for first-time-only coupons (counts completed/confirmed bookings). */
  guestEmail?: string;
  /** When validating blog promos, any linked service id on the post counts. */
  blogServiceIds?: string[];
};

function normalizeIdList(ids?: string[]): string[] {
  return (ids ?? []).map((id) => String(id)).filter(Boolean);
}

/** Eligibility beyond active window and redemption limits. */
export function couponEligibilityBlockReason(
  coupon: CouponRecord,
  ctx: CouponEligibilityContext = {}
): string | null {
  const allowedServices = normalizeIdList(coupon.serviceIds);
  if (allowedServices.length > 0) {
    const serviceId = ctx.serviceId ? String(ctx.serviceId) : "";
    const blogIds = normalizeIdList(ctx.blogServiceIds);
    const matchesBooking = serviceId && allowedServices.includes(serviceId);
    const matchesBlog =
      blogIds.length > 0 && blogIds.some((id) => allowedServices.includes(id));
    if (!matchesBooking && !matchesBlog) {
      return "This coupon does not apply to the selected service";
    }
  }

  const allowedCategories = (coupon.categoryIds ?? []).map((c) => c.trim()).filter(Boolean);
  if (allowedCategories.length > 0 && ctx.serviceCategory) {
    if (!allowedCategories.includes(ctx.serviceCategory)) {
      return "This coupon does not apply to the selected service";
    }
  }

  return null;
}

/** Full validation for checkout (sync; first-time check is async). */
export function validateCouponForBookingSync(
  coupon: CouponRecord,
  ctx: CouponEligibilityContext,
  now = new Date()
): string | null {
  const base = couponRedemptionBlockReason(coupon, now);
  if (base) return base;
  return couponEligibilityBlockReason(coupon, ctx);
}

/** Returns a user-facing error if the coupon cannot be redeemed right now. */
export function couponRedemptionBlockReason(
  coupon: CouponRecord,
  now = new Date()
): string | null {
  if (coupon.active === false) {
    return "This coupon is not active";
  }
  const windowError = couponAvailabilityError(coupon, now);
  if (windowError) return windowError;
  if (
    coupon.maxRedemptions != null &&
    (coupon.redemptionCount ?? 0) >= coupon.maxRedemptions
  ) {
    return "Coupon code redemption limit reached";
  }
  return null;
}

export function isCouponRedeemable(coupon: CouponRecord, now = new Date()): boolean {
  return couponRedemptionBlockReason(coupon, now) === null;
}

/** Human-readable discount (fixed `value` is dollars CAD, same as checkout). */
export function formatCouponDiscountLabel(
  coupon: Pick<CouponRecord, "type" | "value">,
  style: "short" | "long" = "short"
): string {
  if (coupon.type === "percent") {
    return style === "long"
      ? `${coupon.value}% off your treatment`
      : `${coupon.value}% off`;
  }
  const amount = coupon.value.toFixed(coupon.value % 1 === 0 ? 0 : 2);
  return style === "long" ? `$${amount} CAD off your treatment` : `$${amount} off`;
}

export function formatCouponExpiryLabel(expiresAt?: Date | string | null): string | null {
  if (!expiresAt) return null;
  return `Valid until ${formatEdmontonFullDate(new Date(expiresAt))}`;
}
