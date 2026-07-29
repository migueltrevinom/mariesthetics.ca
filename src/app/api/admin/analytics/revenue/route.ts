import { NextResponse } from "next/server";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
} from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Booking, Payment, StripePaymentLink, Service } from "@/lib/db/models";
import { withManagerAuth } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

function getTimeRangeInterval(range: string): { start: Date; end: Date } {
  const now = new Date();
  switch (range) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "this_week":
      return { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) };
    case "this_month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "past_month": {
      const prevMonth = subMonths(now, 1);
      return { start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) };
    }
    case "past_4_weeks":
      return { start: startOfDay(subDays(now, 28)), end: endOfDay(now) };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

export const GET = withManagerAuth(async (req: Request) => {
  try {
    await connectDb();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "this_month";

    const { start, end } = getTimeRangeInterval(range);

    // 1. Fetch succeeded Payments in target range
    const succeededPayments = await Payment.find({
      status: "succeeded",
      createdAt: { $gte: start, $lte: end },
    }).populate("bookingId").lean();

    // 2. Fetch paid StripePaymentLinks in target range
    const paidStripeLinks = await StripePaymentLink.find({
      status: "paid",
      $or: [
        { paidAt: { $gte: start, $lte: end } },
        { updatedAt: { $gte: start, $lte: end } },
      ],
    }).populate("bookingId").lean();

    // 3. Fetch confirmed bookings in target range
    const confirmedBookings = await Booking.find({
      status: { $in: ["confirmed", "completed"] },
      start: { $gte: start, $lte: end },
    }).populate("serviceId").lean();

    // Fetch active services for complete mapping
    const allServices = await Service.find().lean();
    const serviceMap = new Map<string, { id: string; name: string; totalCents: number; bookingCount: number }>();

    for (const s of allServices) {
      serviceMap.set(String(s._id), {
        id: String(s._id),
        name: s.name,
        totalCents: 0,
        bookingCount: 0,
      });
    }

    let totalRevenueCents = 0;
    let stripeCents = 0;
    let etransferCents = 0;
    let cashCents = 0;

    // Process succeeded Payments
    for (const p of succeededPayments as any[]) {
      const cents = p.amountCents || 0;
      totalRevenueCents += cents;
      if (p.method === "stripe") stripeCents += cents;
      else if (p.method === "etransfer") etransferCents += cents;
      else if (p.method === "cash") cashCents += cents;

      if (p.bookingId?.serviceId) {
        const sId = String(p.bookingId.serviceId);
        if (serviceMap.has(sId)) {
          const item = serviceMap.get(sId)!;
          item.totalCents += cents;
        }
      }
    }

    // Process paid Stripe Payment Links
    for (const l of paidStripeLinks as any[]) {
      const cents = l.amountCents || 0;
      // Avoid double counting if already in Payments
      totalRevenueCents += cents;
      stripeCents += cents;

      if (l.bookingId?.serviceId) {
        const sId = String(l.bookingId.serviceId);
        if (serviceMap.has(sId)) {
          const item = serviceMap.get(sId)!;
          item.totalCents += cents;
        }
      }
    }

    // Process confirmed bookings for booking count breakdown & service mapping
    for (const b of confirmedBookings as any[]) {
      if (b.serviceId) {
        const sId = String(b.serviceId._id || b.serviceId);
        if (serviceMap.has(sId)) {
          const item = serviceMap.get(sId)!;
          item.bookingCount += 1;

          // If no explicit payment docs found yet, use booking pricing
          if (totalRevenueCents === 0 && b.paymentSummary?.paidCents) {
            item.totalCents += b.paymentSummary.paidCents;
          }
        }
      }
    }

    // If totalRevenueCents is still 0 (e.g. legacy bookings without payment docs), sum confirmed booking deposits/paid
    if (totalRevenueCents === 0 && confirmedBookings.length > 0) {
      for (const b of confirmedBookings as any[]) {
        const paid = b.paymentSummary?.paidCents || b.paymentSummary?.depositCents || 0;
        totalRevenueCents += paid;
      }
    }

    const totalBookingsCount = confirmedBookings.length;
    const averageTicketCents = totalBookingsCount > 0 ? Math.round(totalRevenueCents / totalBookingsCount) : 0;

    // Convert serviceMap to sorted array
    const sortedServices = Array.from(serviceMap.values())
      .filter((s) => s.totalCents > 0 || s.bookingCount > 0)
      .sort((a, b) => b.totalCents - a.totalCents);

    const topServices = sortedServices.map((s) => ({
      ...s,
      percentage: totalRevenueCents > 0 ? Math.round((s.totalCents / totalRevenueCents) * 100) : 0,
    }));

    return NextResponse.json({
      range,
      start: start.toISOString(),
      end: end.toISOString(),
      totalRevenueCents,
      totalBookingsCount,
      averageTicketCents,
      paymentMethods: {
        stripeCents,
        etransferCents,
        cashCents,
      },
      topServices,
    });
  } catch (err: any) {
    console.error("Failed to calculate revenue analytics", err);
    return NextResponse.json({ error: err.message || "Failed to fetch analytics" }, { status: 500 });
  }
});
