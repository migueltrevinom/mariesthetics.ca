import { connectDb } from "@/lib/db/connect";
import { Booking, Coupon, GiftCard } from "@/lib/db/models";
import { syncCouponToStripe } from "@/lib/payments/stripeCoupons";
import { sendEmail } from "@/lib/mailgun";
import { config } from "@/lib/config";
import { generateGiftCardEmailHtml } from "@/lib/mailgun/templates/gift-card-email";

export class PromotionRepository {
  /**
   * Create discount coupon and sync to Stripe API.
   */
  static async createCoupon(data: {
    code: string;
    type: "percent" | "fixed";
    value: number;
    maxRedemptions?: number | null;
    startsAt?: Date | null;
    expiresAt?: Date | null;
    firstTimeClientsOnly?: boolean;
    serviceIds?: string[];
    categoryIds?: string[];
  }): Promise<{ coupon: any; stripeError: string | null }> {
    await connectDb();
    const cleanCode = data.code.toUpperCase().trim();

    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      throw new Error(`Coupon code '${cleanCode}' already exists`);
    }

    let stripeCouponId = "";
    let stripePromotionCodeId = "";
    let stripeError: string | null = null;
    try {
      const stripeResult = await syncCouponToStripe({
        code: cleanCode,
        type: data.type,
        value: data.value,
        maxRedemptions: data.maxRedemptions,
        expiresAt: data.expiresAt,
      });
      stripeCouponId = stripeResult.stripeCouponId;
      stripePromotionCodeId = stripeResult.stripePromotionCodeId;
    } catch (err: any) {
      stripeError = err?.message || "Stripe coupon sync failed";
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      type: data.type,
      value: data.value,
      maxRedemptions: data.maxRedemptions || null,
      startsAt: data.startsAt || null,
      expiresAt: data.expiresAt || null,
      firstTimeClientsOnly: Boolean(data.firstTimeClientsOnly),
      serviceIds: data.serviceIds ?? [],
      categoryIds: data.categoryIds ?? [],
      stripeCouponId,
      stripePromotionCodeId,
      active: true,
    });

    return { coupon, stripeError };
  }

  /**
   * Fetch all discount coupons.
   */
  static async getAllCoupons(): Promise<any[]> {
    await connectDb();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return coupons;
  }

  /**
   * Delete coupon by ID.
   */
  static async updateCouponRules(
    id: string,
    data: {
      firstTimeClientsOnly?: boolean;
      serviceIds?: string[];
      categoryIds?: string[];
    },
  ): Promise<any> {
    await connectDb();
    const update: Record<string, unknown> = {};
    if (data.firstTimeClientsOnly !== undefined) {
      update.firstTimeClientsOnly = data.firstTimeClientsOnly;
    }
    if (data.serviceIds !== undefined) {
      update.serviceIds = data.serviceIds;
    }
    if (data.categoryIds !== undefined) {
      update.categoryIds = data.categoryIds;
    }
    const coupon = await Coupon.findByIdAndUpdate(id, update, { new: true });
    if (!coupon) throw new Error("Coupon not found");
    return coupon;
  }

  static async updateCouponWindow(
    id: string,
    data: { startsAt: Date | null; expiresAt: Date | null },
  ): Promise<any> {
    await connectDb();
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { startsAt: data.startsAt, expiresAt: data.expiresAt },
      { new: true },
    );
    if (!coupon) throw new Error("Coupon not found");
    return coupon;
  }

  static async getCouponRedemptions(id: string): Promise<{ coupon: any; redemptions: any[] }> {
    await connectDb();
    const coupon = await Coupon.findById(id).lean();
    if (!coupon) throw new Error("Coupon not found");

    const bookings = await Booking.find({ couponId: coupon._id })
      .populate("serviceId", "name")
      .sort({ start: -1 })
      .select("guest serviceId start status paymentSummary")
      .lean();

    const redemptions = bookings.map((booking: any) => ({
      id: String(booking._id),
      guestName: booking.guest?.name || "Guest",
      guestEmail: booking.guest?.email || "",
      serviceName: booking.serviceId?.name || "Service",
      start: booking.start ? new Date(booking.start).toISOString() : null,
      status: booking.status || "",
      discountCents: booking.paymentSummary?.discountCents || 0,
    }));

    return { coupon, redemptions };
  }

  static async deleteCoupon(id: string): Promise<any> {
    await connectDb();
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) throw new Error("Coupon not found");
    return coupon;
  }

  /**
   * Issue digital gift card and sync to Stripe API.
   */
  static async createGiftCard(data: {
    amountCad: number;
    recipientEmail: string;
    recipientName?: string;
    senderName?: string;
    senderEmail?: string;
    message?: string;
    code?: string;
  }): Promise<any> {
    await connectDb();

    const generatedCode =
      data.code?.toUpperCase().trim() ||
      `MARI-GIFT-${Math.floor(100000 + Math.random() * 900000)}`;

    const amountCents = Math.round(data.amountCad * 100);

    let stripeCouponId = "";
    let stripePromotionCodeId = "";
    try {
      const stripeResult = await syncCouponToStripe({
        code: generatedCode,
        type: "fixed",
        value: data.amountCad,
        maxRedemptions: 1,
      });
      stripeCouponId = stripeResult.stripeCouponId;
      stripePromotionCodeId = stripeResult.stripePromotionCodeId;
    } catch (err: any) {
      console.error("[Gift Card Stripe Sync Error]:", err?.message || err);
    }

    const giftCard = await GiftCard.create({
      code: generatedCode,
      initialBalanceCents: amountCents,
      remainingBalanceCents: amountCents,
      senderName: data.senderName || "Mari Esthetics Studio",
      senderEmail: data.senderEmail || "mari@mariesthetics.ca",
      recipientName: data.recipientName || "Valued Client",
      recipientEmail: data.recipientEmail.toLowerCase().trim(),
      message: data.message || "",
      stripeCouponId,
      stripePromotionCodeId,
      active: true,
    });

    // Send Mailgun luxury present box voucher delivery email to recipient
    const recipientName = data.recipientName || "Valued Client";
    const senderName = data.senderName || "Mari Esthetics Studio";

    const html = generateGiftCardEmailHtml({
      code: generatedCode,
      amountCad: data.amountCad,
      recipientName,
      senderName,
      message: data.message,
      appUrl: config.appUrl,
    });

    try {
      await sendEmail({
        to: data.recipientEmail,
        subject: `🎁 You received a $${data.amountCad} Gift Card from ${senderName}!`,
        html,
      });
    } catch (err: any) {
      console.error("[Gift Card Email Error]:", err.message);
    }

    return giftCard;
  }

  /**
   * Fetch all digital gift cards.
   */
  static async getAllGiftCards(): Promise<any[]> {
    await connectDb();
    const giftCards = await GiftCard.find().sort({ createdAt: -1 }).lean();
    return giftCards;
  }

  /**
   * Delete gift card by ID.
   */
  static async deleteGiftCard(id: string): Promise<any> {
    await connectDb();
    const giftCard = await GiftCard.findByIdAndDelete(id);
    if (!giftCard) throw new Error("Gift card not found");
    return giftCard;
  }
}
