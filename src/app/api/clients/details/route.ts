import { NextResponse } from "next/server";
import { withManagerAuth } from "@/lib/auth/jwt";
import { connectDb } from "@/lib/db/connect";
import { Booking } from "@/lib/db/models/Booking";
import { Payment } from "@/lib/db/models/Payment";
import { ServiceImage } from "@/lib/db/models/ServiceImage";
import { ClientCreditCard } from "@/lib/db/models/ClientCreditCard";
import { ClientSubscription } from "@/lib/db/models/ClientSubscription";
import { Review } from "@/lib/db/models/Review";
import "@/lib/db/models/Service"; // Ensure Service schema is registered
import "@/lib/db/models/SubscriptionPlan"; // Ensure SubscriptionPlan schema is registered
import mongoose from "mongoose";

async function handleGetDetails(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "A valid Client ID is required." }, { status: 400 });
    }

    await connectDb();

    // Fetch client bookings
    const bookings = await Booking.find({ clientId: id })
      .sort({ start: -1 })
      .populate("serviceId")
      .lean();

    const bookingIds = bookings.map((b) => b._id);

    // Fetch payments, deep populating booking service details
    const payments = await Payment.find({ bookingId: { $in: bookingIds } })
      .sort({ createdAt: -1 })
      .populate({
        path: "bookingId",
        populate: { path: "serviceId" },
      })
      .lean();

    // Fetch session images (treatment logs)
    const sessionImages = await ServiceImage.find({ clientId: id })
      .sort({ createdAt: -1 })
      .populate("serviceId")
      .lean();

    // Fetch credit cards (billing info)
    const creditCards = await ClientCreditCard.find({ clientId: id })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch subscriptions
    const subscriptions = await ClientSubscription.find({ clientId: id })
      .sort({ createdAt: -1 })
      .populate("planId")
      .lean();

    // Fetch client reviews
    const reviews = await Review.find({
      $or: [{ clientId: id }, { bookingId: { $in: bookingIds } }],
    })
      .sort({ createdAt: -1 })
      .populate("serviceId")
      .populate("bookingId")
      .lean();

    return NextResponse.json({
      bookings,
      payments,
      sessionImages,
      creditCards,
      subscriptions,
      reviews,
    });
  } catch (err: any) {
    console.error("[ClientDetails GET Error]:", err.message);
    return NextResponse.json({ error: "Failed to load client details." }, { status: 500 });
  }
}

export const GET = withManagerAuth(handleGetDetails);
