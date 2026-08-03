import type { Metadata } from "next";
import { requireManager } from "@/lib/auth/jwt";
import { fetchCoupons, fetchGiftCards } from "@/app/api/admin/promotions/modules/promotion.module";
import { PromotionsManager } from "@/components/admin/PromotionsManager";

export const metadata: Metadata = {
  title: "Coupons & Gift Certificates | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPromotionsPage() {
  await requireManager();

  const rawCoupons = await fetchCoupons();
  const rawGiftCards = await fetchGiftCards();

  const formattedCoupons = rawCoupons.map((c: any) => ({
    _id: String(c._id),
    code: c.code,
    type: c.type,
    value: c.value,
    maxRedemptions: c.maxRedemptions,
    redemptionCount: c.redemptionCount || 0,
    expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
    stripeCouponId: c.stripeCouponId || "",
    active: Boolean(c.active),
  }));

  const formattedGiftCards = rawGiftCards.map((g: any) => ({
    _id: String(g._id),
    code: g.code,
    initialBalanceCents: g.initialBalanceCents,
    remainingBalanceCents: g.remainingBalanceCents,
    senderName: g.senderName,
    recipientName: g.recipientName,
    recipientEmail: g.recipientEmail,
    stripeCouponId: g.stripeCouponId || "",
    active: Boolean(g.active),
    createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : undefined,
  }));

  return <PromotionsManager initialCoupons={formattedCoupons} initialGiftCards={formattedGiftCards} />;
}
