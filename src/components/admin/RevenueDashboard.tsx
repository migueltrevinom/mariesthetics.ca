"use client";

import { useState, useEffect } from "react";
import { formatCad } from "@/lib/money";

type RangeOption = "today" | "this_week" | "this_month" | "past_month" | "past_4_weeks";

interface TopService {
  id: string;
  name: string;
  totalCents: number;
  bookingCount: number;
  percentage: number;
}

interface AnalyticsData {
  range: string;
  start: string;
  end: string;
  totalRevenueCents: number;
  totalBookingsCount: number;
  averageTicketCents: number;
  paymentMethods: {
    stripeCents: number;
    etransferCents: number;
    cashCents: number;
  };
  topServices: TopService[];
}

const RANGE_LABELS: { key: RangeOption; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "past_month", label: "Past Month" },
  { key: "past_4_weeks", label: "Past 4 Weeks" },
];

export function RevenueDashboard() {
  const [range, setRange] = useState<RangeOption>("this_month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = async (selectedRange: RangeOption) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics/revenue?range=${selectedRange}`);
      if (!res.ok) {
        throw new Error("Failed to load revenue analytics");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAnalytics(range);
  }, [range]);

  return (
    <div className="space-y-8 text-left w-full">
      {/* Timeframe Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-color)]">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Revenue & Financial Analytics
          </h2>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5">
            Real-time income, payment methods breakdown, and top-performing services.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.02] border border-[var(--border-color)] p-1 rounded-2xl shadow-inner self-start sm:self-auto">
          {RANGE_LABELS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setRange(item.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                range === item.key
                  ? "bg-white/[0.08] text-[var(--ink)] border border-[#c8a86b] shadow-sm font-bold"
                  : "border border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="border border-blush/30 bg-blush/10 p-4 rounded-xl text-xs text-blush font-semibold">
          ✕ {error}
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="border border-[#c8a86b]/40 bg-gradient-to-br from-[#c8a86b]/[0.08] to-transparent p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-bold text-[#c8a86b]">
              Total Revenue
            </p>
            <span className="text-lg">💰</span>
          </div>
          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-[var(--ink)] tracking-tight">
            {loading ? "..." : formatCad(data?.totalRevenueCents ?? 0)}
          </p>
          <p className="mt-2 text-[11px] text-[var(--ink-soft)] font-medium">
            Incomes collected in {RANGE_LABELS.find((r) => r.key === range)?.label}
          </p>
        </div>

        {/* Confirmed Bookings */}
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-bold text-[var(--ink-soft)]">
              Confirmed Appointments
            </p>
            <span className="text-lg">📅</span>
          </div>
          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-[var(--ink)]">
            {loading ? "..." : data?.totalBookingsCount ?? 0}
          </p>
          <p className="mt-2 text-[11px] text-[var(--ink-soft)] font-medium">
            Paid & confirmed bookings
          </p>
        </div>

        {/* Average Ticket */}
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-bold text-[var(--ink-soft)]">
              Avg. Ticket Value
            </p>
            <span className="text-lg">✨</span>
          </div>
          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-[var(--ink)]">
            {loading ? "..." : formatCad(data?.averageTicketCents ?? 0)}
          </p>
          <p className="mt-2 text-[11px] text-[var(--ink-soft)] font-medium">
            Average revenue per booking
          </p>
        </div>

        {/* Payment Methods Split */}
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-5 rounded-2xl shadow-sm space-y-2">
          <p className="text-xs uppercase tracking-wider font-bold text-[var(--ink-soft)]">
            Payment Methods
          </p>
          <div className="space-y-1.5 pt-1 text-xs text-[var(--ink)]">
            <div className="flex justify-between items-center">
              <span className="text-[var(--ink-soft)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#9dceb8]"></span> Stripe / Card:
              </span>
              <span className="font-semibold">{loading ? "..." : formatCad(data?.paymentMethods.stripeCents ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--ink-soft)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#c8a86b]"></span> e-Transfer:
              </span>
              <span className="font-semibold">{loading ? "..." : formatCad(data?.paymentMethods.etransferCents ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--ink-soft)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/40"></span> Cash / Other:
              </span>
              <span className="font-semibold">{loading ? "..." : formatCad(data?.paymentMethods.cashCents ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Revenue Services Breakdown */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="font-semibold text-lg text-[var(--ink)]">
              Top Revenue Generating Services
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              Which services generated the highest income during {RANGE_LABELS.find((r) => r.key === range)?.label.toLowerCase()}.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-[var(--ink-soft)] animate-pulse">
            Calculating service revenue stats...
          </div>
        ) : !data?.topServices || data.topServices.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--ink-soft)] italic">
            No completed revenue records for this timeframe.
          </p>
        ) : (
          <div className="space-y-4">
            {data.topServices.map((service, idx) => (
              <div
                key={service.id}
                className="p-4 border border-[var(--border-color)] bg-white/[0.01] rounded-xl space-y-2 hover:border-[#c8a86b]/40 transition-colors"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#c8a86b]/10 border border-[#c8a86b]/30 text-xs font-bold text-[#c8a86b]">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--ink)] leading-tight">
                        {service.name}
                      </p>
                      <p className="text-[11px] text-[var(--ink-soft)] mt-0.5">
                        {service.bookingCount} appointment{service.bookingCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-sm text-[var(--ink)]">
                      {formatCad(service.totalCents)}
                    </p>
                    <p className="text-[10px] text-[#c8a86b] font-semibold">
                      {service.percentage}% of total revenue
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(service.percentage, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
