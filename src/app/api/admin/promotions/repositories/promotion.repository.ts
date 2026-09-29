import { connectDb } from "@/lib/db/connect";
import { Booking, Coupon, GiftCard } from "@/lib/db/models";
import { syncCouponToStripe } from "@/lib/payments/stripeCoupons";
import { sendEmail } from "@/lib/mailgun";
import { config } from "@/lib/config";

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

    // Send Mailgun voucher delivery email to recipient
    const recipientName = data.recipientName || "Valued Client";
    const senderName = data.senderName || "Mari Esthetics Studio";
    const messageText = data.message ? `<p style="font-style: italic; color: #4a4035;">"${data.message}"</p>` : "";

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #faf9f6; padding: 32px; border-radius: 16px; border: 1px solid #e8e3d9; color: #24180a;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #c8a86b; font-size: 24px; margin: 0;">Mari Esthetics Studio</h2>
          <p style="color: #665b4e; font-size: 13px; margin-top: 4px;">Edmonton, Alberta</p>
        </div>

        <div style="background: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #eae5db; text-align: center;">
          <span style="font-size: 36px; display: block; margin-bottom: 8px;">🎁</span>
          <h3 style="margin-top: 0; color: #24180a; font-size: 20px;">You've Received a Digital Gift Card!</h3>
          <p style="color: #4a4035; font-size: 14px;">From <strong>${senderName}</strong></p>

          ${messageText}

          <div style="background: #f7f4ed; border: 2px dashed #c8a86b; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <p style="margin: 0; font-size: 12px; uppercase; letter-spacing: 1px; color: #887d70; font-weight: bold;">Gift Voucher Code</p>
            <p style="margin: 8px 0 0 0; font-size: 26px; font-family: monospace; font-weight: bold; color: #2f5d4a; letter-spacing: 2px;">${generatedCode}</p>
            <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold; color: #24180a;">Value: $${data.amountCad.toFixed(2)} CAD</p>
          </div>

          <p style="color: #4a4035; line-height: 1.6; font-size: 13px;">
            Redeem your gift voucher during online booking checkout or present it at your studio appointment!
          </p>

          <div style="margin-top: 24px;">
            <a href="${config.appUrl}/book" style="background-color: #2f5d4a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; font-size: 13px; display: inline-block;">
              Book Your Session Now →
            </a>
          </div>
        </div>

        <p style="text-align: center; font-size: 11px; color: #887d70; margin-top: 24px;">
          Mari Esthetics · Edmonton, AB · Thank you for being a part of our community!
        </p>
      </div>
    `;

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
