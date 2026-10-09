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

    // ⚡ Bolt Optimization: Execute independent analytics queries in parallel with Promise.all
    // to cut API database latency from 4 sequential DB round-trips to 1 concurrent batch.
    const [
      succeededPayments,
      paidStripeLinks,
      confirmedBookings,
      allServices,
    ] = await Promise.all([
      Payment.find({
        status: "succeeded",
        createdAt: { $gte: start, $lte: end },
      }).populate("bookingId").lean(),

      StripePaymentLink.find({
        status: "paid",
        $or: [
          { paidAt: { $gte: start, $lte: end } },
          { updatedAt: { $gte: start, $lte: end } },
        ],
      }).populate("bookingId").lean(),

      Booking.find({
        status: { $in: ["confirmed", "completed"] },
        start: { $gte: start, $lte: end },
      }).populate("serviceId").lean(),

      Service.find().lean(),
    ]);
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

    const countedSessionIds = new Set<string>();
    // Stripe payments not yet paired to a payment-link row, keyed by booking + amount.
    const unmatchedStripePayments = new Map<string, number>();

    function bookingIdOf(bookingId: unknown): string {
      if (!bookingId) return "";
      if (typeof bookingId === "object" && bookingId !== null && "_id" in bookingId) {
        return String((bookingId as { _id: unknown })._id);
      }
      return String(bookingId);
    }

    function addServiceCents(serviceId: unknown, cents: number) {
      if (!serviceId) return;
      const sId = String(serviceId);
      const item = serviceMap.get(sId);
      if (item) item.totalCents += cents;
    }

    function stripeMatchKey(bookingId: unknown, amountCents: number) {
      return `${bookingIdOf(bookingId)}|${amountCents}`;
    }

    // Process succeeded Payments. Tips stay out of service revenue.
    for (const p of succeededPayments as any[]) {
      if (p.kind === "tip") continue;
      const cents = p.amountCents || 0;
      totalRevenueCents += cents;
      if (p.method === "stripe") stripeCents += cents;
      else if (p.method === "etransfer") etransferCents += cents;
      else if (p.method === "cash") cashCents += cents;

      addServiceCents(p.bookingId?.serviceId, cents);

      if (p.method === "stripe") {
        const sessionId = String(p.stripeCheckoutSessionId || "");
        if (sessionId) countedSessionIds.add(sessionId);
        const key = stripeMatchKey(p.bookingId, cents);
        unmatchedStripePayments.set(key, (unmatchedStripePayments.get(key) ?? 0) + 1);
      }
    }

    function consumeStripePayment(bookingId: unknown, cents: number) {
      const key = stripeMatchKey(bookingId, cents);
      const unmatched = unmatchedStripePayments.get(key) ?? 0;
      if (unmatched <= 0) return false;
      unmatchedStripePayments.set(key, unmatched - 1);
      return true;
    }

    // Paid Stripe links are the checkout for a payment, not a second charge.
    // Count a link only when no succeeded Payment already represents it.
    for (const l of paidStripeLinks as any[]) {
      if (l.kind === "tip") continue;
      const cents = l.amountCents || 0;
      const sessionId = String(l.stripeSessionId || "");
      if (sessionId && countedSessionIds.has(sessionId)) {
        consumeStripePayment(l.bookingId, cents);
        continue;
      }
      if (consumeStripePayment(l.bookingId, cents)) continue;

      totalRevenueCents += cents;
      stripeCents += cents;
      addServiceCents(l.bookingId?.serviceId, cents);
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
