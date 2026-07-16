"use client";

import { useState, useEffect, useTransition } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isToday,
} from "date-fns";
import { formatCad } from "@/lib/money";
import { ManualBookingModal, ServiceOption, ClientOption } from "./ManualBookingModal";
import { BookingActions } from "./BookingActions";

interface BookingItem {
  _id: string;
  start: string;
  end: string;
  status: string;
  notes?: string;
  depositMethod?: string;
  guest?: {
    name: string;
    email: string;
    phone?: string;
  };
  serviceId?: {
    _id: string;
    name: string;
    durationMin: number;
    priceCents: number;
    depositCents: number;
  };
  paymentSummary?: {
    totalCents: number;
    depositCents: number;
    paidCents: number;
    balanceDueCents: number;
  };
}

interface BookingCalendarProps {
  services: ServiceOption[];
  clients: ClientOption[];
}

export function BookingCalendar({ services, clients }: BookingCalendarProps) {
  const [activeDate, setActiveDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<Date | undefined>(undefined);
  
  // Detail sidebar controls
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  // Range determination
  const getRange = (date: Date, currentView: typeof view) => {
    let start: Date;
    let end: Date;

    if (currentView === "month") {
      start = startOfWeek(startOfMonth(date));
      end = endOfWeek(endOfMonth(date));
    } else if (currentView === "week") {
      start = startOfWeek(date);
      end = endOfWeek(date);
    } else {
      start = new Date(date);
      start.setHours(0, 0, 0, 0);
      end = new Date(date);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { start, end } = getRange(activeDate, view);
      const res = await fetch(
        `/api/bookings?scope=admin&start=${start.toISOString()}&end=${end.toISOString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.error("Failed to load calendar bookings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBookings();
  }, [activeDate, view]);

  // Navigate actions
  const next = () => {
    if (view === "month") setActiveDate(addMonths(activeDate, 1));
    else if (view === "week") setActiveDate(addWeeks(activeDate, 1));
    else setActiveDate(addDays(activeDate, 1));
  };

  const prev = () => {
    if (view === "month") setActiveDate(subMonths(activeDate, 1));
    else if (view === "week") setActiveDate(subWeeks(activeDate, 1));
    else setActiveDate(subDays(activeDate, 1));
  };

  const today = () => {
    setActiveDate(new Date());
  };

  // Helper arrays for calendar grid
  const daysInView = () => {
    const { start, end } = getRange(activeDate, view);
    return eachDayOfInterval({ start, end });
  };

  // Week View hour range (8 AM to 8 PM)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // [8, 9, ..., 20]

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full text-[var(--ink)]">
      <div className="flex-1 flex flex-col bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm min-w-0">
        
        {/* Navigation & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)] mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-[family-name:var(--font-display)] tracking-wide capitalize">
              {view === "day" && format(activeDate, "eeee, MMMM d, yyyy")}
              {view === "week" && `Week of ${format(startOfWeek(activeDate), "MMM d, yyyy")}`}
              {view === "month" && format(activeDate, "MMMM yyyy")}
            </h2>
            {loading && (
              <span className="text-xs text-[var(--ink-soft)] bg-white/[0.04] border border-[var(--border-color)] rounded px-2 py-0.5 animate-pulse">
                loading…
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* View Selectors */}
            <div className="flex bg-white/[0.02] border border-[var(--border-color)] p-0.5 rounded-xl text-xs font-semibold shadow-inner">
              {(["month", "week", "day"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer capitalize transition-all duration-200 ${
                    view === v
                      ? "bg-white/[0.08] dark:bg-white/[0.06] text-[var(--ink)] border border-[var(--border-color)] font-bold shadow-sm"
                      : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Back, Today, Forward */}
            <div className="flex items-center gap-1 border border-[var(--border-color)] rounded-xl p-0.5 bg-white/[0.01]">
              <button
                type="button"
                onClick={prev}
                className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-lg hover:bg-white/[0.03] cursor-pointer"
                title="Previous"
              >
                ←
              </button>
              <button
                type="button"
                onClick={today}
                className="px-3 py-1.5 text-xs text-[var(--ink)] font-semibold rounded-lg hover:bg-white/[0.03] cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={next}
                className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-lg hover:bg-white/[0.03] cursor-pointer"
                title="Next"
              >
                →
              </button>
            </div>

            {/* Direct Create Booking */}
            <button
              type="button"
              onClick={() => {
                setModalDefaultDate(new Date());
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:from-[#e2c78c] hover:to-[#c8a86b] hover:shadow-[0_0_15px_rgba(200,168,107,0.25)] text-[#24180a] font-semibold text-xs py-2 px-4 rounded-xl transition-all duration-300 cursor-pointer text-center"
            >
              + Book
            </button>
          </div>
        </div>

        {/* --- MONTH VIEW --- */}
        {view === "month" && (
          <div className="flex-1 flex flex-col min-h-[500px]">
            {/* Weekdays header */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2 border-b border-[var(--border-color)]">{day}</div>
              ))}
            </div>
            {/* Grid days */}
            <div className="grid grid-cols-7 flex-1 border-l border-t border-[var(--border-color)]">
              {daysInView().map((day) => {
                const dayBookings = bookings.filter((b) => isSameDay(new Date(b.start), day));
                const inMonth = isSameMonth(day, activeDate);
                const current = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={(e) => {
                      // Prevent modal launch if clicking a booking capsule
                      if ((e.target as HTMLElement).closest(".booking-capsule")) return;
                      setModalDefaultDate(day);
                      setIsModalOpen(true);
                    }}
                    className={`min-h-[100px] p-2 border-r border-b border-[var(--border-color)] flex flex-col relative transition-colors duration-200 cursor-pointer hover:bg-white/[0.01] ${
                      !inMonth ? "opacity-35" : ""
                    } ${current ? "bg-[#c8a86b]/[0.03] dark:bg-[#c8a86b]/[0.02]" : ""}`}
                  >
                    <span
                      className={`text-xs font-bold self-start w-5 h-5 flex items-center justify-center rounded-full mb-1.5 ${
                        current ? "bg-[#c8a86b] text-black" : "text-[var(--ink-soft)]"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Bookings Capsules */}
                    <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] scrollbar-thin">
                      {dayBookings.slice(0, 3).map((b) => (
                        <div
                          key={b._id}
                          onClick={() => setSelectedBooking(b)}
                          className="booking-capsule text-[10px] p-1 border rounded-lg truncate cursor-pointer transition-all duration-200 flex flex-col text-left hover:scale-[1.01] hover:brightness-110"
                          style={{
                            backgroundColor:
                              b.status === "held"
                                ? "rgba(208, 141, 143, 0.08)"
                                : b.status === "confirmed"
                                ? "rgba(47, 107, 80, 0.2)"
                                : b.status === "completed"
                                ? "rgba(200, 168, 107, 0.12)"
                                : "rgba(255, 255, 255, 0.02)",
                            borderColor:
                              b.status === "held"
                                ? "rgba(208, 141, 143, 0.25)"
                                : b.status === "confirmed"
                                ? "rgba(47, 107, 80, 0.4)"
                                : b.status === "completed"
                                ? "rgba(200, 168, 107, 0.3)"
                                : "rgba(255, 255, 255, 0.06)",
                            color:
                              b.status === "held"
                                ? "var(--blush)"
                                : b.status === "confirmed"
                                ? "#9dceb8"
                                : b.status === "completed"
                                ? "var(--gold-bright)"
                                : "var(--ink-soft)",
                          }}
                        >
                          <div className="font-semibold truncate">{b.guest?.name}</div>
                          <div className="opacity-80 truncate">
                            {format(new Date(b.start), "h:mm a")} · {b.serviceId?.name}
                          </div>
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-[9px] text-center text-[var(--ink-soft)] font-medium">
                          + {dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- WEEK VIEW --- */}
        {view === "week" && (
          <div className="flex-1 flex flex-col min-h-[600px] overflow-x-auto">
            {/* Grid container with hours and columns */}
            <div className="grid grid-cols-[60px_1fr] flex-1 min-w-[700px]">
              {/* Vertical hours column */}
              <div className="border-r border-[var(--border-color)] pr-2 py-3 flex flex-col justify-between text-[10px] text-[var(--ink-soft)] select-none">
                {hours.map((h) => (
                  <div key={h} className="h-[50px] text-right font-semibold">
                    {h > 12 ? `${h - 12} PM` : h === 12 ? "12 PM" : `${h} AM`}
                  </div>
                ))}
              </div>

              {/* 7 Days Columns */}
              <div className="grid grid-cols-7 flex-1 border-t border-l border-[var(--border-color)]">
                {daysInView().map((day) => {
                  const dayBookings = bookings.filter((b) => isSameDay(new Date(b.start), day));
                  const current = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`relative border-r border-b border-[var(--border-color)] min-h-[650px] flex flex-col ${
                        current ? "bg-[#c8a86b]/[0.015]" : ""
                      }`}
                    >
                      {/* Day Header */}
                      <div className="py-2 text-center border-b border-[var(--border-color)] select-none bg-white/[0.01]">
                        <div className="text-[10px] uppercase font-bold text-[var(--ink-soft)]">
                          {format(day, "ccc")}
                        </div>
                        <div
                          className={`mt-0.5 text-xs font-bold inline-flex items-center justify-center w-5.5 h-5.5 rounded-full ${
                            current ? "bg-[#c8a86b] text-black" : "text-[var(--ink)]"
                          }`}
                        >
                          {format(day, "d")}
                        </div>
                      </div>

                      {/* Hour slots background grid */}
                      <div
                        className="flex-1 relative cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest(".week-booking-card")) return;
                          
                          // Calculate hour clicked based on relative click position
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const clickY = e.clientY - rect.top;
                          const ratio = clickY / rect.height;
                          const hourFraction = ratio * (hours.length - 1);
                          const hour = Math.floor(hourFraction) + hours[0];
                          
                          const clickDate = new Date(day);
                          clickDate.setHours(hour, 0, 0, 0);
                          
                          setModalDefaultDate(clickDate);
                          setIsModalOpen(true);
                        }}
                      >
                        {/* Render horizontal divider lines */}
                        {hours.slice(0, -1).map((_, idx) => (
                          <div
                            key={idx}
                            className="absolute left-0 right-0 border-b border-[var(--border-color)]/30"
                            style={{ top: `${(idx + 1) * (100 / (hours.length - 1))}%` }}
                          ></div>
                        ))}

                        {/* Rent Booking Cards */}
                        {dayBookings.map((b) => {
                          const startDate = new Date(b.start);
                          const endDate = new Date(b.end);
                          
                          const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                          const endHour = endDate.getHours() + endDate.getMinutes() / 60;
                          
                          const startPct = ((startHour - hours[0]) / (hours.length - 1)) * 100;
                          const durationHr = endHour - startHour;
                          const heightPct = (durationHr / (hours.length - 1)) * 100;

                          // Guard checks
                          if (startHour < hours[0] || startHour > hours[hours.length - 1]) return null;

                          return (
                            <div
                              key={b._id}
                              onClick={() => setSelectedBooking(b)}
                              className="week-booking-card absolute left-1 right-1 p-2 border rounded-xl overflow-hidden text-left flex flex-col justify-between shadow-sm cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:brightness-110 z-10"
                              style={{
                                top: `${startPct}%`,
                                height: `${Math.max(heightPct, 8)}%`, // At least 8% height so it has readable dimensions
                                backgroundColor:
                                  b.status === "held"
                                    ? "rgba(208, 141, 143, 0.08)"
                                    : b.status === "confirmed"
                                    ? "rgba(47, 107, 80, 0.2)"
                                    : b.status === "completed"
                                    ? "rgba(200, 168, 107, 0.12)"
                                    : "rgba(255, 255, 255, 0.02)",
                                borderColor:
                                  b.status === "held"
                                    ? "rgba(208, 141, 143, 0.25)"
                                    : b.status === "confirmed"
                                    ? "rgba(47, 107, 80, 0.4)"
                                    : b.status === "completed"
                                    ? "rgba(200, 168, 107, 0.3)"
                                    : "rgba(255, 255, 255, 0.06)",
                                color:
                                  b.status === "held"
                                    ? "var(--blush)"
                                    : b.status === "confirmed"
                                    ? "#9dceb8"
                                    : b.status === "completed"
                                    ? "var(--gold-bright)"
                                    : "var(--ink-soft)",
                              }}
                            >
                              <div className="font-semibold text-[10px] leading-tight truncate">
                                {b.guest?.name}
                              </div>
                              <div className="text-[9px] opacity-80 leading-none truncate">
                                {format(startDate, "h:mm a")} · {b.serviceId?.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- DAY VIEW --- */}
        {view === "day" && (
          <div className="flex-1 flex flex-col min-h-[500px]">
            <div className="grid grid-cols-[70px_1fr] flex-1">
              {/* Hours Column */}
              <div className="border-r border-[var(--border-color)] pr-3 py-4 flex flex-col justify-between text-[11px] text-[var(--ink-soft)] select-none">
                {hours.map((h) => (
                  <div key={h} className="h-[60px] text-right font-semibold">
                    {h > 12 ? `${h - 12} PM` : h === 12 ? "12 PM" : `${h} AM`}
                  </div>
                ))}
              </div>

              {/* Day details & Schedule */}
              <div
                className="relative border-l border-t border-[var(--border-color)] flex-1 min-h-[720px] cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest(".day-booking-card")) return;
                  
                  // Calculate time slot clicked
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const ratio = clickY / rect.height;
                  const hourFraction = ratio * (hours.length - 1);
                  const hour = Math.floor(hourFraction) + hours[0];
                  
                  const clickDate = new Date(activeDate);
                  clickDate.setHours(hour, 0, 0, 0);
                  
                  setModalDefaultDate(clickDate);
                  setIsModalOpen(true);
                }}
              >
                {/* Dividers */}
                {hours.slice(0, -1).map((_, idx) => (
                  <div
                    key={idx}
                    className="absolute left-0 right-0 border-b border-[var(--border-color)]/30"
                    style={{ top: `${(idx + 1) * (100 / (hours.length - 1))}%` }}
                  ></div>
                ))}

                {/* Day Bookings cards */}
                {bookings
                  .filter((b) => isSameDay(new Date(b.start), activeDate))
                  .map((b) => {
                    const startDate = new Date(b.start);
                    const endDate = new Date(b.end);
                    
                    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                    const endHour = endDate.getHours() + endDate.getMinutes() / 60;
                    
                    const startPct = ((startHour - hours[0]) / (hours.length - 1)) * 100;
                    const durationHr = endHour - startHour;
                    const heightPct = (durationHr / (hours.length - 1)) * 100;

                    if (startHour < hours[0] || startHour > hours[hours.length - 1]) return null;

                    return (
                      <div
                        key={b._id}
                        onClick={() => setSelectedBooking(b)}
                        className="day-booking-card absolute left-4 right-4 p-4 border rounded-xl overflow-hidden text-left flex flex-col justify-between shadow-md cursor-pointer transition-all duration-200 hover:left-3 hover:right-3 hover:brightness-110 z-10"
                        style={{
                          top: `${startPct}%`,
                          height: `${Math.max(heightPct, 10)}%`,
                          backgroundColor:
                            b.status === "held"
                              ? "rgba(208, 141, 143, 0.08)"
                              : b.status === "confirmed"
                              ? "rgba(47, 107, 80, 0.2)"
                              : b.status === "completed"
                              ? "rgba(200, 168, 107, 0.12)"
                              : "rgba(255, 255, 255, 0.02)",
                          borderColor:
                            b.status === "held"
                              ? "rgba(208, 141, 143, 0.25)"
                              : b.status === "confirmed"
                              ? "rgba(47, 107, 80, 0.4)"
                              : b.status === "completed"
                              ? "rgba(200, 168, 107, 0.3)"
                              : "rgba(255, 255, 255, 0.06)",
                          color:
                            b.status === "held"
                              ? "var(--blush)"
                              : b.status === "confirmed"
                              ? "#9dceb8"
                              : b.status === "completed"
                              ? "var(--gold-bright)"
                              : "var(--ink-soft)",
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{b.guest?.name}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded border border-current bg-black/10">
                              {b.status}
                            </span>
                          </div>
                          <p className="text-xs opacity-90 mt-1 font-medium">
                            {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")} · {b.serviceId?.name}
                          </p>
                          {b.notes && (
                            <p className="text-[11px] opacity-70 mt-2 italic truncate max-w-[90%]">
                              Note: "{b.notes}"
                            </p>
                          )}
                        </div>
                        <div className="text-[10px] opacity-70 text-right">
                          Due: {formatCad(b.paymentSummary?.balanceDueCents ?? 0)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- SIDEBAR / DETAIL DRAWER --- */}
      {selectedBooking && (
        <div className="w-full md:w-80 flex flex-col bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-lg shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <h3 className="font-semibold text-lg">Booking Details</h3>
            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-4 text-sm text-left">
            <div>
              <label className="text-[9px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-0.5">
                Service
              </label>
              <p className="text-base font-semibold leading-tight">{selectedBooking.serviceId?.name}</p>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                {selectedBooking.serviceId?.durationMin} minutes duration
              </p>
            </div>

            <div className="border-t border-[var(--border-color)] pt-3">
              <label className="text-[9px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-0.5">
                Guest Information
              </label>
              <p className="font-semibold text-[var(--ink)]">{selectedBooking.guest?.name}</p>
              <p className="text-xs text-[var(--ink-soft)]">{selectedBooking.guest?.email}</p>
              {selectedBooking.guest?.phone && (
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">{selectedBooking.guest?.phone}</p>
              )}
            </div>

            <div className="border-t border-[var(--border-color)] pt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-0.5">
                  Scheduled
                </label>
                <p className="font-medium text-xs">
                  {format(new Date(selectedBooking.start), "PP")}
                </p>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  {format(new Date(selectedBooking.start), "h:mm a")}
                </p>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-0.5">
                  Status
                </label>
                <span
                  className="inline-block text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded border border-current mt-0.5 bg-black/10"
                  style={{
                    color:
                      selectedBooking.status === "held"
                        ? "var(--blush)"
                        : selectedBooking.status === "confirmed"
                        ? "#9dceb8"
                        : selectedBooking.status === "completed"
                        ? "var(--gold-bright)"
                        : "var(--ink-soft)",
                  }}
                >
                  {selectedBooking.status}
                </span>
              </div>
            </div>

            <div className="border-t border-[var(--border-color)] pt-3">
              <label className="text-[9px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-0.5">
                Notes
              </label>
              <p className="text-xs text-[var(--ink-soft)] leading-relaxed italic">
                {selectedBooking.notes ? `"${selectedBooking.notes}"` : "(No custom notes)"}
              </p>
            </div>

            <div className="border-t border-[var(--border-color)] pt-3">
              <label className="text-[9px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-1">
                Accounting & Paid Summary
              </label>
              <table className="w-full text-xs text-[var(--ink-soft)]">
                <tbody>
                  <tr>
                    <td className="py-1">Total Pricing:</td>
                    <td className="py-1 text-right text-[var(--ink)] font-medium">
                      {formatCad(selectedBooking.paymentSummary?.totalCents ?? 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1">Paid Deposit:</td>
                    <td className="py-1 text-right text-[var(--ink)] font-medium">
                      {formatCad(selectedBooking.paymentSummary?.paidCents ?? 0)}
                    </td>
                  </tr>
                  <tr className="border-t border-[var(--border-color)] font-semibold text-[var(--ink)]">
                    <td className="py-1.5">Balance Due:</td>
                    <td className="py-1.5 text-right">
                      {formatCad(selectedBooking.paymentSummary?.balanceDueCents ?? 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border-t border-[var(--border-color)] pt-4 flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-0.5">
                Actions
              </label>
              <BookingActions
                bookingId={selectedBooking._id}
                status={selectedBooking.status}
                balanceDueCents={selectedBooking.paymentSummary?.balanceDueCents ?? 0}
                onUpdate={() => {
                  void fetchBookings();
                  // Re-fetch detail sidebar info dynamically
                  setTimeout(async () => {
                    try {
                      const res = await fetch(`/api/bookings/${selectedBooking._id}`);
                      if (res.ok) {
                        const { booking } = await res.json();
                        if (booking) setSelectedBooking(booking);
                      }
                    } catch (e) {}
                  }, 100);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Manual Booking Modal Trigger */}
      <ManualBookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalDefaultDate(undefined);
        }}
        onSuccess={() => {
          void fetchBookings();
        }}
        defaultDate={modalDefaultDate}
        services={services}
        clients={clients}
      />
    </div>
  );
}
