import { NextResponse } from "next/server";
import {
  fetchCoupons,
  createCoupon,
  removeCoupon,
  fetchGiftCards,
  issueGiftCard,
  removeGiftCard,
} from "../modules/promotion.module";
import { getStripe, isStripeConfigured } from "@/lib/payments/stripe";
import { config } from "@/lib/config";

export async function handleGetCoupons(): Promise<NextResponse> {
  try {
    const coupons = await fetchCoupons();
    return NextResponse.json({ success: true, coupons });
  } catch (err: any) {
    console.error("[Promotion Controller Get Coupons Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function handleCreateCoupon(req: Request, validatedData: any): Promise<NextResponse> {
  try {
    const expiresAt = validatedData.expiresAt ? new Date(validatedData.expiresAt) : null;
    const coupon = await createCoupon({ ...validatedData, expiresAt });
    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (err: any) {
    console.error("[Promotion Controller Create Coupon Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to create coupon" }, { status: 500 });
  }
}

export async function handleDeleteCoupon(req: Request, id: string): Promise<NextResponse> {
  try {
    const coupon = await removeCoupon(id);
    return NextResponse.json({ success: true, message: "Coupon deleted", coupon });
  } catch (err: any) {
    console.error("[Promotion Controller Delete Coupon Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to delete coupon" }, { status: 500 });
  }
}

export async function handleGetGiftCards(): Promise<NextResponse> {
  try {
    const giftCards = await fetchGiftCards();
    return NextResponse.json({ success: true, giftCards });
  } catch (err: any) {
    console.error("[Promotion Controller Get Gift Cards Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch gift cards" }, { status: 500 });
  }
}

export async function handleIssueGiftCard(req: Request, validatedData: any): Promise<NextResponse> {
  try {
    const giftCard = await issueGiftCard(validatedData);
    return NextResponse.json({ success: true, giftCard }, { status: 201 });
  } catch (err: any) {
    console.error("[Promotion Controller Issue Gift Card Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to issue gift card" }, { status: 500 });
  }
}

export async function handleDeleteGiftCard(req: Request, id: string): Promise<NextResponse> {
  try {
    const giftCard = await removeGiftCard(id);
    return NextResponse.json({ success: true, message: "Gift card deleted", giftCard });
  } catch (err: any) {
    console.error("[Promotion Controller Delete Gift Card Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to delete gift card" }, { status: 500 });
  }
}

export async function handlePublicGiftCardCheckoutSession(
  req: Request,
  validatedData: {
    amountCad: number;
    recipientEmail: string;
    recipientName?: string;
    senderName?: string;
    senderEmail?: string;
    message?: string;
  }
): Promise<NextResponse> {
  try {
    if (!isStripeConfigured()) {
      // Fallback: issue directly if Stripe not configured in dev
      const giftCard = await issueGiftCard(validatedData);
      return NextResponse.json({
        success: true,
        directIssue: true,
        giftCard,
        url: `${config.appUrl}/gift-cards?success=true&code=${giftCard.code}`,
      });
    }

    const stripe = getStripe();
    const amountCents = Math.round(validatedData.amountCad * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `Mari Esthetics Digital Gift Card ($${validatedData.amountCad} CAD)`,
              description: `Gift voucher for ${validatedData.recipientName || validatedData.recipientEmail}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: validatedData.senderEmail || undefined,
      metadata: {
        type: "gift_card_purchase",
        amountCad: String(validatedData.amountCad),
        recipientEmail: validatedData.recipientEmail,
        recipientName: validatedData.recipientName || "",
        senderName: validatedData.senderName || "",
        senderEmail: validatedData.senderEmail || "",
        message: validatedData.message || "",
      },
      success_url: `${config.appUrl}/gift-cards?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.appUrl}/gift-cards?cancelled=true`,
    });

    return NextResponse.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("[Public Gift Card Checkout Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to create Stripe Checkout session" }, { status: 500 });
  }
}
