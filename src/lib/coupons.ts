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
