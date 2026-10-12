import { NextResponse } from "next/server";
import { z } from "zod";
import {
  fetchCoupons,
  createCoupon,
  updateCouponWindow,
  updateCouponRules,
  fetchCouponRedemptions,
  removeCoupon,
  fetchGiftCards,
  issueGiftCard,
  removeGiftCard,
} from "../modules/promotion.module";
import { parseCouponDay } from "@/lib/coupons";
import { getStripe, isStripeConfigured } from "@/lib/payments/stripe";
import { config, getAppUrl } from "@/lib/config";

export async function handleGetCoupons(): Promise<NextResponse> {
  try {
    const coupons = await fetchCoupons();
    return NextResponse.json({ success: true, coupons });
  } catch (err: any) {
    console.error("[Promotion Controller Get Coupons Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

function couponWindowFromBody(body: { startsAt?: string | null; expiresAt?: string | null }) {
  const startsAt = parseCouponDay(body.startsAt, "start");
  const expiresAt = parseCouponDay(body.expiresAt, "end");
  if (startsAt && expiresAt && startsAt > expiresAt) {
    throw new Error("Coupon end date must be on or after the start date");
  }
  return { startsAt, expiresAt };
}

export async function handleCreateCoupon(req: Request, validatedData: any): Promise<NextResponse> {
  try {
    const { startsAt, expiresAt } = couponWindowFromBody(validatedData);
    const { coupon, stripeError } = await createCoupon({ ...validatedData, startsAt, expiresAt });
    return NextResponse.json({ success: true, coupon, stripeError }, { status: 201 });
  } catch (err: any) {
    console.error("[Promotion Controller Create Coupon Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to create coupon" }, { status: 500 });
  }
}

const updateCouponSchema = z.object({
  startsAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  firstTimeClientsOnly: z.boolean().optional(),
  serviceIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
});

export async function handleGetCoupon(id: string): Promise<NextResponse> {
  try {
    const { coupon, redemptions } = await fetchCouponRedemptions(id);
    return NextResponse.json({ success: true, coupon, redemptions });
  } catch (err: any) {
    const status = err.message === "Coupon not found" ? 404 : 500;
    return NextResponse.json({ error: err.message || "Failed to load coupon" }, { status });
  }
}

export async function handleUpdateCoupon(req: Request, id: string): Promise<NextResponse> {
  try {
    const body = updateCouponSchema.parse(await req.json());
    let coupon;
    if (body.startsAt !== undefined || body.expiresAt !== undefined) {
      const { startsAt, expiresAt } = couponWindowFromBody(body);
      coupon = await updateCouponWindow(id, { startsAt, expiresAt });
    }
    if (
      body.firstTimeClientsOnly !== undefined ||
      body.serviceIds !== undefined ||
      body.categoryIds !== undefined
    ) {
      coupon = await updateCouponRules(id, {
        firstTimeClientsOnly: body.firstTimeClientsOnly,
        serviceIds: body.serviceIds,
        categoryIds: body.categoryIds,
      });
    }
    if (!coupon) {
      return NextResponse.json({ error: "No coupon fields to update" }, { status: 400 });
    }
    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    const status = err.message === "Coupon not found" ? 404 : 400;
    return NextResponse.json({ error: err.message || "Failed to update coupon" }, { status });
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
    const baseUrl = getAppUrl(req);

    if (!isStripeConfigured()) {
      // Fallback: issue directly if Stripe not configured in dev
      const giftCard = await issueGiftCard(validatedData);
      return NextResponse.json({
        success: true,
        directIssue: true,
        giftCard,
        url: `${baseUrl}/gift-cards?success=true&code=${giftCard.code}`,
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
      success_url: `${baseUrl}/gift-cards?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/gift-cards?cancelled=true`,
    });

    return NextResponse.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("[Public Gift Card Checkout Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to create Stripe Checkout session" }, { status: 500 });
  }
}
