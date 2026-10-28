import { NextResponse } from "next/server";
import { withManagerAuth } from "@/lib/auth/jwt";
import { connectDb } from "@/lib/db/connect";
import { Booking } from "@/lib/db/models/Booking";
import { Payment } from "@/lib/db/models/Payment";
import { ServiceImage } from "@/lib/db/models/ServiceImage";
import { ClientCreditCard } from "@/lib/db/models/ClientCreditCard";
import { ClientSubscription } from "@/lib/db/models/ClientSubscription";
import { Review } from "@/lib/db/models/Review";
import { QuizSubmission } from "@/lib/db/models/QuizSubmission";
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
      .populate("couponId")
      .lean();

    const bookingIds = bookings.map((b) => b._id);

    // ⚡ Bolt Optimization: Execute secondary queries in parallel with Promise.all
    // to cut database round-trip latency from 6 sequential DB waits down to 1 concurrent batch.
    const [
      payments,
      sessionImages,
      creditCards,
      subscriptions,
      reviews,
      quizSubmissions,
    ] = await Promise.all([
      Payment.find({ bookingId: { $in: bookingIds } })
        .sort({ createdAt: -1 })
        .populate({
          path: "bookingId",
          populate: { path: "serviceId" },
        })
        .lean(),

      ServiceImage.find({ clientId: id })
        .sort({ createdAt: -1 })
        .populate("serviceId")
        .lean(),

      ClientCreditCard.find({ clientId: id })
        .sort({ createdAt: -1 })
        .lean(),

      ClientSubscription.find({ clientId: id })
        .sort({ createdAt: -1 })
        .populate("planId")
        .lean(),

      Review.find({
        $or: [{ clientId: id }, { bookingId: { $in: bookingIds } }],
      })
        .sort({ createdAt: -1 })
        .populate("serviceId")
        .populate("bookingId")
        .lean(),

      QuizSubmission.find({ clientId: id })
        .sort({ createdAt: -1 })
        .populate("quizId")
        .populate("recommendedServiceId")
        .lean(),
    ]);

    return NextResponse.json({
      bookings,
      payments,
      sessionImages,
      creditCards,
      subscriptions,
      reviews,
      quizSubmissions,
    });
  } catch (err: any) {
    console.error("[ClientDetails GET Error]:", err.message);
    return NextResponse.json({ error: "Failed to load client details." }, { status: 500 });
  }
}

export const GET = withManagerAuth(handleGetDetails);
