import { connectDb } from "@/lib/db/connect";
import { Booking } from "@/lib/db/models";
import {
  type CouponEligibilityContext,
  type CouponRecord,
  validateCouponForBookingSync,
} from "@/lib/coupons";

export function mapCouponDocToRecord(doc: Record<string, unknown>): CouponRecord {
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

async function guestHasPriorVisits(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) return false;
  await connectDb();
  const count = await Booking.countDocuments({
    status: { $in: ["confirmed", "completed"] },
    "guest.email": normalized,
  });
  return count > 0;
}

export async function validateCouponForBooking(
  coupon: CouponRecord,
  ctx: CouponEligibilityContext
): Promise<string | null> {
  const syncError = validateCouponForBookingSync(coupon, ctx);
  if (syncError) return syncError;

  if (coupon.firstTimeClientsOnly && ctx.guestEmail?.trim()) {
    if (await guestHasPriorVisits(ctx.guestEmail)) {
      return "This offer is for first-time clients only";
    }
  }

  return null;
}
