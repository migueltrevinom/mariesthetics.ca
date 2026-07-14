import Stripe from "stripe";
import { config } from "@/lib/config";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!config.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(config.stripeSecretKey);
  }
  return stripeClient;
}

export function isStripeConfigured() {
  return Boolean(config.stripeSecretKey);
}
