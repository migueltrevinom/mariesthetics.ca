import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking, Payment, Product } from "@/lib/db/models";
import { config, getAppUrl } from "@/lib/config";
import { getStripe, isStripeConfigured } from "@/lib/payments/stripe";

const bodySchema = z.object({
  bookingId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured on the server. Please check STRIPE_SECRET_KEY in .env" },
        { status: 503 }
      );
    }

    const { bookingId } = bodySchema.parse(await req.json());
    await connectDb();

    const booking = await Booking.findById(bookingId).populate("serviceId");
    if (!booking || (booking.status !== "held" && booking.status !== "confirmed")) {
      return NextResponse.json({ error: "Invalid or cancelled booking" }, { status: 400 });
    }

    const amount = booking.paymentSummary?.depositCents ?? 0;
    if (amount <= 0) {
      return NextResponse.json({ error: "No deposit due for this booking" }, { status: 400 });
    }

    // Look up mapped Product for this service deposit
    const serviceObj = booking.serviceId as any;
    const mappedProduct = serviceObj
      ? await Product.findOne({ serviceId: serviceObj._id, kind: "deposit" })
      : null;

    const productName = mappedProduct
      ? mappedProduct.name
      : `${serviceObj?.name || "Esthetics Service"} - Reservation Deposit`;

    const stripe = getStripe();

    const payment = await Payment.create({
      bookingId: booking._id,
      kind: "deposit",
      method: "stripe",
      amountCents: amount,
      status: "pending",
      note: `Deposit for ${serviceObj?.name || "Service"} (Product: ${productName})`,
    });

    const baseUrl = getAppUrl(req);

    // Create Stripe Checkout Session for seamless payment
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: productName,
              description: `Reservation deposit for ${serviceObj?.name || "Appointment"} on ${new Date(booking.start).toLocaleDateString()}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: booking.guest?.email,
      success_url: `${baseUrl}/payment-link?bookingId=${booking._id}&paymentId=${payment._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/book?serviceId=${serviceObj?._id || ""}`,
      metadata: {
        bookingId: String(booking._id),
        paymentId: String(payment._id),
        productId: mappedProduct ? String(mappedProduct._id) : "",
        kind: "deposit",
      },
    });

    payment.stripeCheckoutSessionId = checkoutSession.id;
    if (checkoutSession.payment_intent) {
      payment.stripePaymentIntentId = String(checkoutSession.payment_intent);
    }
    await payment.save();

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      publishableKey: config.stripePublishableKey,
      amountCents: amount,
      productName,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error("[Stripe Deposit Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create deposit payment session" },
      { status: 500 }
    );
  }
}
