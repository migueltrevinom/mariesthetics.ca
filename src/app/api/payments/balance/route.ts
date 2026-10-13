import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Booking, StudioCharge } from "@/lib/db/models";
import { AuthError, getSession } from "@/lib/auth/jwt";
import { getAppUrl } from "@/lib/config";
import { isStripeConfigured } from "@/lib/payments/stripe";
import { signStudioChargeToken } from "@/lib/payments/studioChargeToken";
import {
  tipCentsFor,
} from "@/lib/payments/studioCharge";

const bodySchema = z.object({
  bookingId: z.string().min(1),
  amountCents: z.number().int().positive().optional(),
  tipCents: z.number().int().nonnegative().optional(),
  compliment: z.string().max(250).optional(),
  forceNew: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthError("Unauthorized", 401);
    }
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    await connectDb();

    if (!isStripeConfigured()) {
      return NextResponse.json({ url: null });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (session.role !== "manager") {
      const isOwner =
        session.role === "client" &&
        (String(booking.clientId) === session.sub ||
          booking.guest?.email?.toLowerCase() === session.email.toLowerCase());
      if (!isOwner) {
        throw new AuthError("Unauthorized", 403);
      }
    }

    // Find latest open StudioCharge for this booking
    const existingCharge = await StudioCharge.findOne({
      bookingId: booking._id,
      status: "open",
    }).sort({ createdAt: -1 });

    if (existingCharge) {
      const payUrl = `${getAppUrl(req)}/pay?t=${encodeURIComponent(await signStudioChargeToken(String(existingCharge._id)))}`;
      return NextResponse.json({ url: payUrl, chargeId: existingCharge._id });
    }

    return NextResponse.json({ url: null });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to fetch balance link" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authSession = await getSession();
    if (!authSession) {
      throw new AuthError("Unauthorized", 401);
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 },
      );
    }

    const body = bodySchema.parse(await req.json());
    await connectDb();

    const booking = await Booking.findById(body.bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Permission: either studio manager or the booking owner
    if (authSession.role !== "manager") {
      const isOwner =
        authSession.role === "client" &&
        (String(booking.clientId) === authSession.sub ||
          booking.guest?.email?.toLowerCase() === authSession.email.toLowerCase());
      if (!isOwner) {
        throw new AuthError("You do not have permission to pay balance for this booking", 403);
      }
    }

    const amount =
      body.amountCents ?? booking.paymentSummary?.balanceDueCents ?? 0;
    if (amount <= 0) {
      return NextResponse.json({ error: "No balance due" }, { status: 400 });
    }

    // Check for existing open StudioCharge for this booking if forceNew is not set
    let charge = null;
    if (!body.forceNew) {
      charge = await StudioCharge.findOne({
        bookingId: booking._id,
        status: "open",
        baseAmountCents: amount,
      }).sort({ createdAt: -1 });
    }

    const clientEmail = (booking.guest?.email || authSession.email || "").toLowerCase().trim();
    const clientName = booking.guest?.name || "";
    const description = booking.service?.name
      ? `Remaining Balance — ${booking.service.name}`
      : "Remaining Treatment Balance";

    if (!charge) {
      // Cancel prior open charges for this booking
      await StudioCharge.updateMany(
        { bookingId: booking._id, status: "open" },
        { $set: { status: "cancelled" } }
      );

      charge = await StudioCharge.create({
        bookingId: booking._id,
        baseAmountCents: amount,
        tipPercent: 10,
        tipCents: tipCentsFor(amount, 10),
        totalCents: amount + tipCentsFor(amount, 10),
        clientName,
        clientEmail,
        description,
        status: "open",
      });
    }

    const payUrl = `${getAppUrl(req)}/pay?t=${encodeURIComponent(await signStudioChargeToken(String(charge._id)))}`;

    return NextResponse.json({ url: payUrl, chargeId: charge._id });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create balance link" }, { status: 500 });
  }
}
