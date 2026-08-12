import { getStripe, isStripeConfigured } from "@/lib/payments/stripe";

export interface SyncStripePlanParams {
  name: string;
  priceCents: number;
  interval: "month" | "year";
  existingStripePriceId?: string;
}

/**
 * Creates or updates a recurring Stripe Product & Price for a SubscriptionPlan.
 * Returns the generated stripePriceId (e.g. price_1N...).
 */
export async function syncStripePriceForPlan(params: SyncStripePlanParams): Promise<string> {
  if (!isStripeConfigured()) {
    return params.existingStripePriceId || "";
  }

  try {
    const stripe = getStripe();

    // Create a new Stripe Product
    const product = await stripe.products.create({
      name: `Mari Esthetics — ${params.name}`,
    });

    // Create a recurring Stripe Price in CAD
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: params.priceCents,
      currency: "cad",
      recurring: {
        interval: params.interval,
      },
    });

    return price.id;
  } catch (err: any) {
    console.error("[Stripe Subscription Sync Error]:", err.message || err);
    return params.existingStripePriceId || "";
  }
}
