"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  isToday,
} from "date-fns";
import { formatCad } from "@/lib/money";
import { getFastIpfsUrl } from "@/lib/ipfs";
import { LuxuryInvoiceReceipt } from "@/components/invoice/LuxuryInvoiceReceipt";
import { ConfettiEffect } from "@/components/ui/ConfettiEffect";

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  facials: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800",
  facial: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800",
  lashes: "https://images.unsplash.com/photo-1583001809873-a1284d563572?auto=format&fit=crop&q=80&w=800",
  permanentMakeUp: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
  brows: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
  general: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
};

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  referralCode?: string;
}

interface AppointmentItem {
  id: string;
  start: string;
  end: string;
  status: string;
  depositMethod?: string;
  service: {
    id: string;
    name: string;
    category: string;
    durationMin: number;
    priceCents: number;
    photos: string[];
  } | null;
  paymentSummary: {
    totalCents: number;
    depositCents: number;
    paidCents: number;
    tipCents: number;
    discountCents: number;
    balanceDueCents: number;
  };
  hasPendingBalance?: boolean;
}

interface PaymentItem {
  id: string;
  source: "booking" | "studio_charge";
  date: string;
  description: string;
  amountCents: number;
  kind: string;
  method: string;
  status: string;
  bookingId?: string;
  chargeId?: string;
}

interface InvoiceData {
  number: string;
  id: string;
  type: string;
  date: string;
  appointmentDate?: string;
  status: string;
  merchant: {
    name: string;
    tagline: string;
    address: string;
    email: string;
    phone: string;
  };
  client: {
    name: string;
    email: string;
    phone?: string;
  };
  appointment?: {
    id?: string;
    serviceName: string;
    durationMin: number;
    start: string | null;
    end?: string | null;
  } | null;
  reconciliation?: {
    treatmentTotalCents: number;
    depositPaidCents?: number;
    balancePaidCents?: number;
    tipPercent?: number;
    tipCents?: number;
    discountCents?: number;
    totalChargedTodayCents?: number;
    totalPaidToDateCents: number;
    balanceDueCents: number;
  };
  items: Array<{
    description: string;
    amountCents: number;
  }>;
  subtotalCents: number;
  tipCents: number;
  discountCents: number;
  totalCents: number;
  paidCents: number;
  balanceDueCents: number;
  paymentMethod: string;
}

export function ClientDashboard({ initialSessionName }: { initialSessionName: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"appointments" | "payments" | "profile">("appointments");
  const [appointmentView, setAppointmentView] = useState<"list" | "calendar">("list");
  const [appointmentFilter, setAppointmentFilter] = useState<"all" | "upcoming" | "past">("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);

  // Profile edit form state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCountryCode, setProfileCountryCode] = useState("+1");
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Calendar month state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  // Invoice modal state
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceData | null>(null);

  // Pay remaining balance state
  const [payingBalanceId, setPayingBalanceId] = useState<string | null>(null);
  const [tippingBookingId, setTippingBookingId] = useState<string | null>(null);

  async function handlePayBalance(bookingId: string, forceNew = false) {
    setPayingBalanceId(bookingId);
    // Pre-open blank tab synchronously during user click to guarantee popup blockers do not intercept
    const payWindow = window.open("about:blank", "_blank");
    try {
      const res = await fetch("/api/payments/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, forceNew }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start balance payment");
      if (data.url) {
        if (payWindow) {
          payWindow.location.href = data.url;
        } else {
          window.open(data.url, "_blank");
        }
      } else {
        if (payWindow) payWindow.close();
      }
    } catch (err: unknown) {
      if (payWindow) payWindow.close();
      alert(err instanceof Error ? err.message : "Failed to open payment page");
    } finally {
      setPayingBalanceId(null);
    }
  }

  async function handleLeaveTip(bookingId: string) {
    setTippingBookingId(bookingId);
    const tipWindow = window.open("about:blank", "_blank");
    try {
      const res = await fetch("/api/payments/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, amountCents: 1500, returnUrl: "/portal" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start tip checkout");
      if (data.url) {
        if (tipWindow) {
          tipWindow.location.href = data.url;
        } else {
          window.open(data.url, "_blank");
        }
      } else {
        if (tipWindow) tipWindow.close();
      }
    } catch (err: unknown) {
      if (tipWindow) tipWindow.close();
      alert(err instanceof Error ? err.message : "Failed to open tip checkout");
    } finally {
      setTippingBookingId(null);
    }
  }

  async function loadDashboardData(silent = false) {
    if (!silent) {
      setLoading(true);
    }
    setError("");
    try {
      const res = await fetch("/api/portal/data");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load portal data");

      setClient(data.client);
      setAppointments(data.appointments || []);
      setPayments(data.payments || []);

      if (data.client) {
        setProfileName((prev) => prev || data.client.name || "");
        setProfileEmail((prev) => prev || data.client.email || "");
        setProfilePhone((prev) => prev || data.client.phone || "");
        setProfileCountryCode((prev) => prev || data.client.countryCode || "+1");
      }
    } catch (err: unknown) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadDashboardData(false);

    // Auto-refresh when tab regains focus or visibility (e.g. after customer pays balance in a new tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadDashboardData(true);
      }
    };
    const handleFocus = () => {
      void loadDashboardData(true);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Keyboard navigation (Escape key) & scroll lock for invoice modal
  useEffect(() => {
    if (!activeInvoice) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveInvoice(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeInvoice]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileUpdating(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      const res = await fetch("/api/portal/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName.trim(),
          email: profileEmail.trim().toLowerCase(),
          phone: profilePhone.trim(),
          countryCode: profileCountryCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setProfileSuccess("Profile updated successfully and synced across all your bookings!");
      setClient((prev) => (prev ? { ...prev, ...data.client } : data.client));
      // Reload dashboard data so appointments reflection is fresh
      void loadDashboardData();
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setProfileUpdating(false);
    }
  }

  async function handleViewInvoice(id: string) {
    setInvoiceLoading(true);
    try {
      const res = await fetch(`/api/portal/invoice/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invoice not found");
      setActiveInvoice(data.invoice);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Unable to load invoice");
    } finally {
      setInvoiceLoading(false);
    }
  }

  function downloadIcs(appointment: AppointmentItem) {
    const start = new Date(appointment.start);
    const end = new Date(appointment.end);
    const serviceName = appointment.service?.name || "Mari Esthetics Treatment";
    const dtStart = start.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const dtEnd = end.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const dtStamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Mari Esthetics//Appointment Booking//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:appointment-${start.getTime()}@mariesthetics.ca`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${serviceName} at Mari Esthetics`,
      "DESCRIPTION:Your appointment at Mari Esthetics Studio.\\nAddress: 1211 Gillespie Cres NW\\, Edmonton\\, AB",
      "LOCATION:1211 Gillespie Cres NW\\, Edmonton\\, AB",
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `appointment-${format(start, "yyyy-MM-dd")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filtered appointments list
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    if (appointmentFilter === "upcoming") {
      return appointments.filter((a) => new Date(a.start) >= now && a.status !== "cancelled");
    }
    if (appointmentFilter === "past") {
      return appointments.filter((a) => new Date(a.start) < now || a.status === "completed");
    }
    return appointments;
  }, [appointments, appointmentFilter]);

  // Calendar dates
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarDate));
    const end = endOfWeek(endOfMonth(calendarDate));
    return eachDayOfInterval({ start, end });
  }, [calendarDate]);

  const appointmentsForSelectedDate = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return appointments.filter((a) => isSameDay(new Date(a.start), selectedCalendarDate));
  }, [appointments, selectedCalendarDate]);

  // Financial summary metrics
  const completedPayments = useMemo(() => {
    return payments.filter((p) => p.status === "succeeded" || p.status === "paid");
  }, [payments]);

  const totalSpentCents = useMemo(() => {
    return completedPayments.reduce((acc, p) => acc + p.amountCents, 0);
  }, [completedPayments]);

  return (
    <div className="aurora grain relative min-h-screen pt-24 sm:pt-32 md:pt-40 pb-20 sm:pb-28 print:min-h-0 print:p-0 print:m-0 print:bg-white print:static">
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-12 left-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(200,168,107,0.12)_0%,transparent_70%)] blur-3xl print:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-12 right-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(31,77,58,0.15)_0%,transparent_70%)] blur-3xl print:hidden"
      />

      <div className={`relative mx-auto max-w-6xl px-4 sm:px-6 md:px-10 ${activeInvoice ? "print:hidden" : ""}`}>
        {/* Top Header Card */}
        <div className="rounded-3xl border border-[var(--line-strong)]/30 bg-[var(--background)]/80 backdrop-blur-2xl p-5 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)] font-[family-name:var(--font-display)] text-xl sm:text-2xl font-semibold shadow-inner shrink-0">
                {(client?.name || initialSessionName || "C").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] tracking-[0.28em] uppercase font-medium text-[var(--gold)] block">
                  Studio Portal
                </span>
                <h1 className="font-[family-name:var(--font-display)] text-base sm:text-2xl md:text-3xl text-[var(--ink)] mt-0.5 sm:mt-1 leading-snug">
                  Hi, {client?.name || initialSessionName}
                </h1>
                <p className="text-xs text-[var(--ink-soft)] font-mono truncate">
                  {client?.email}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/book"
                className="btn-primary !py-2.5 !px-5 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto whitespace-nowrap"
              >
                <span>Book Appointment</span>
                <span aria-hidden="true">→</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto text-center rounded-2xl border border-[var(--line)] bg-[var(--mist)]/40 px-3.5 py-2.5 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[var(--line-strong)] transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Navigation Tabs - 3 column responsive grid on mobile, flex on desktop */}
          <div className="mt-5 sm:mt-8 grid grid-cols-3 sm:flex border-b border-[var(--line-soft)] gap-1 sm:gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("appointments")}
              className={`pb-3 text-xs sm:text-sm font-medium transition-all cursor-pointer relative text-center sm:text-left ${
                activeTab === "appointments"
                  ? "text-[var(--gold)] font-semibold"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              <span className="hidden sm:inline">Appointments</span>
              <span className="sm:hidden">Bookings</span>{" "}
              <span className="text-[10px] sm:text-xs opacity-75">({appointments.length})</span>
              {activeTab === "appointments" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--gold)] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("payments")}
              className={`pb-3 text-xs sm:text-sm font-medium transition-all cursor-pointer relative text-center sm:text-left ${
                activeTab === "payments"
                  ? "text-[var(--gold)] font-semibold"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              <span className="hidden sm:inline">Payments & Invoices</span>
              <span className="sm:hidden">Invoices</span>{" "}
              <span className="text-[10px] sm:text-xs opacity-75">({completedPayments.length})</span>
              {activeTab === "payments" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--gold)] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`pb-3 text-xs sm:text-sm font-medium transition-all cursor-pointer relative text-center sm:text-left ${
                activeTab === "profile"
                  ? "text-[var(--gold)] font-semibold"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              <span className="hidden sm:inline">My Profile</span>
              <span className="sm:hidden">Profile</span>
              {activeTab === "profile" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--gold)] rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="my-16 flex flex-col items-center justify-center gap-3 text-[var(--ink-soft)]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
            <p className="text-xs uppercase tracking-wider">Loading your appointments...</p>
          </div>
        )}

        {/* Global Error Notice */}
        {error && (
          <div className="mt-8 p-4 rounded-2xl bg-[var(--blush)]/10 border border-[var(--blush)]/30 text-[var(--blush)] text-sm">
            {error}
          </div>
        )}

        {/* TAB 1: APPOINTMENTS */}
        {!loading && activeTab === "appointments" && (
          <div className="mt-8 space-y-6">
            {/* View Sub-Controls (List vs Calendar) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="grid grid-cols-2 sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAppointmentView("list")}
                  className={`justify-center px-3.5 sm:px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    appointmentView === "list"
                      ? "bg-[var(--gold)] text-[var(--night)] font-semibold shadow-md"
                      : "bg-[var(--mist)]/50 text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--line)]"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <span>List View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentView("calendar")}
                  className={`justify-center px-3.5 sm:px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    appointmentView === "calendar"
                      ? "bg-[var(--gold)] text-[var(--night)] font-semibold shadow-md"
                      : "bg-[var(--mist)]/50 text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--line)]"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Calendar View</span>
                </button>
              </div>

              {appointmentView === "list" && (
                <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 rounded-xl bg-stone-200/60 dark:bg-white/5 border border-stone-300/60 dark:border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setAppointmentFilter("all")}
                    className={`text-center px-2 sm:px-3 py-1.5 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                      appointmentFilter === "all"
                        ? "bg-white dark:bg-white/15 text-stone-900 dark:text-white font-bold shadow-xs"
                        : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-medium"
                    }`}
                  >
                    All ({appointments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppointmentFilter("upcoming")}
                    className={`text-center px-2 sm:px-3 py-1.5 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                      appointmentFilter === "upcoming"
                        ? "bg-white dark:bg-white/15 text-stone-900 dark:text-white font-bold shadow-xs"
                        : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-medium"
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppointmentFilter("past")}
                    className={`text-center px-2 sm:px-3 py-1.5 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                      appointmentFilter === "past"
                        ? "bg-white dark:bg-white/15 text-stone-900 dark:text-white font-bold shadow-xs"
                        : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-medium"
                    }`}
                  >
                    Past
                  </button>
                </div>
              )}
            </div>

            {/* LIST VIEW */}
            {appointmentView === "list" && (
              <div>
                {filteredAppointments.length === 0 ? (
                  <div className="rounded-3xl border border-[var(--line)] bg-[var(--background)]/60 backdrop-blur-xl p-12 text-center">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center mb-4">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                      No appointments found
                    </h3>
                    <p className="mt-2 text-xs text-[var(--ink-soft)] max-w-sm mx-auto">
                      {appointmentFilter === "upcoming"
                        ? "You don't have any upcoming treatments scheduled."
                        : "You haven't booked an appointment under this account yet."}
                    </p>
                    <Link href="/book" className="btn-primary mt-6 inline-flex text-xs">
                      Book an Appointment Now
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredAppointments.map((b) => {
                      const start = new Date(b.start);
                      const isUpcoming = start >= new Date();
                      const cat = b.service?.category || "general";
                      const rawPhotoUrl =
                        b.service?.photos && b.service.photos.length > 0
                          ? b.service.photos[0]
                          : CATEGORY_FALLBACK_IMAGES[cat] || CATEGORY_FALLBACK_IMAGES.general;
                      const photoUrl = getFastIpfsUrl(rawPhotoUrl);

                      return (
                        <div
                          key={b.id}
                          className="group rounded-3xl border border-[var(--line-strong)]/25 bg-[var(--background)]/85 backdrop-blur-xl overflow-hidden shadow-md hover:shadow-2xl hover:border-[#c8a86b]/50 transition-all duration-500 flex flex-col justify-between"
                        >
                          {/* Photo Thumbnail Banner */}
                          <div className="relative w-full h-56 overflow-hidden bg-black/20">
                            <Image
                              src={photoUrl}
                              alt={b.service?.name || "Treatment"}
                              fill
                              loading="lazy"
                              decoding="async"
                              className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                            {/* Floating Badges */}
                            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                              {/* Status Pill */}
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold backdrop-blur-md border flex items-center gap-1.5 shadow-sm ${
                                  b.status === "confirmed"
                                    ? "bg-emerald-950/85 text-emerald-300 border-emerald-400/40"
                                    : b.status === "completed"
                                    ? "bg-[#24180a]/90 text-amber-300 border-amber-400/40"
                                    : b.status === "held"
                                    ? "bg-amber-950/90 text-amber-300 border-amber-500/40"
                                    : "bg-black/70 text-stone-200 border-white/20"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    b.status === "confirmed"
                                      ? "bg-emerald-400 animate-pulse"
                                      : b.status === "held"
                                      ? "bg-amber-400 animate-pulse"
                                      : "bg-stone-400"
                                  }`}
                                />
                                {b.status === "held" ? "Deposit Pending" : b.status}
                              </span>

                              {/* Category & Duration Badges */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {b.service?.category && (
                                  <span className="hidden sm:inline-block bg-black/60 backdrop-blur-md border border-white/20 px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap shrink-0">
                                    {b.service.category}
                                  </span>
                                )}
                                <span className="bg-[#c8a86b]/95 backdrop-blur-md text-[#24180a] px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm whitespace-nowrap shrink-0">
                                  ⏱ {b.service?.durationMin || 60}m
                                </span>
                              </div>
                            </div>

                            {/* Service Title */}
                            <div className="absolute bottom-4 left-5 right-5 pointer-events-none">
                              <h3 className="font-[family-name:var(--font-display)] text-2xl text-white tracking-tight leading-tight drop-shadow-md">
                                {b.service?.name || "Esthetics Treatment"}
                              </h3>
                            </div>
                          </div>

                          {/* Card Content & Action Footer */}
                          <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                            {/* Schedule & Studio Location */}
                            <div className="space-y-3">
                              {/* Date & Time block */}
                              <div className="rounded-2xl bg-[var(--mist)]/40 dark:bg-white/5 border border-[var(--line-soft)] p-3.5 space-y-2">
                                <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--ink)]">
                                  <svg className="w-4 h-4 text-[#c8a86b] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>{format(start, "EEEE, MMMM d, yyyy")}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-soft)]">
                                  <div className="flex items-center gap-2.5">
                                    <svg className="w-4 h-4 text-[#c8a86b] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-semibold text-[var(--ink)]">{format(start, "h:mm a")}</span>
                                  </div>
                                  <span className="text-[11px] text-[var(--ink-faint)] whitespace-nowrap shrink-0">
                                    {b.service?.durationMin || 60} mins duration
                                  </span>
                                </div>
                              </div>

                              {/* Address */}
                              <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)] px-1">
                                <svg className="w-3.5 h-3.5 text-[#c8a86b] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate">1211 Gillespie Cres NW, Edmonton, AB</span>
                              </div>
                            </div>

                            {/* Financial Ledger Status */}
                            <div className="pt-3 border-t border-[var(--line-soft)] flex items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-600/20 text-emerald-800 dark:text-emerald-300 text-[11px] sm:text-xs font-medium">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  Paid: <strong className="font-mono font-bold text-emerald-900 dark:text-emerald-200">{formatCad(b.paymentSummary.paidCents)}</strong>
                                </span>
                                {b.paymentSummary.tipCents > 0 && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#c8a86b]/15 border border-[#c8a86b]/35 text-[#8b6521] dark:text-[#dfc28d] text-[11px] sm:text-xs font-medium">
                                    <span className="text-amber-500 dark:text-amber-400">✨</span>
                                    Tip: <strong className="font-mono font-bold text-[#6e5015] dark:text-[#f3efe6]">{formatCad(b.paymentSummary.tipCents)}</strong>
                                  </span>
                                )}
                                {b.paymentSummary.balanceDueCents > 0 ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/15 border border-amber-600/30 text-amber-900 dark:text-amber-300 text-[11px] sm:text-xs font-medium">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                    Due: <strong className="font-mono font-bold text-amber-950 dark:text-amber-200">{formatCad(b.paymentSummary.balanceDueCents)}</strong>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-stone-200/60 dark:bg-white/10 text-stone-700 dark:text-stone-300 text-[11px] sm:text-xs font-medium">
                                    ✓ Settled
                                  </span>
                                )}
                              </div>

                              {b.paymentSummary.totalCents > 0 && (
                                <div className="text-right shrink-0">
                                  <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--ink-faint)] block">
                                    {b.paymentSummary.tipCents > 0 ? "Total (+ Tip)" : "Total"}
                                  </span>
                                  <span className="font-mono font-bold text-xs sm:text-sm text-[var(--ink)]">
                                    {formatCad(b.paymentSummary.totalCents + (b.paymentSummary.tipCents || 0))}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Actions Toolbar */}
                            <div className="pt-4 border-t border-[var(--line-soft)] space-y-2.5">
                              {/* Primary CTA if balance due */}
                              {b.paymentSummary.balanceDueCents > 0 && b.status !== "cancelled" && (
                                <div className="space-y-2">
                                  {b.hasPendingBalance && (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-xs p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 shadow-xs">
                                      <span className="flex items-center gap-1.5 font-medium">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                        Checkout started (exited previously)
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => void handlePayBalance(b.id, true)}
                                        disabled={payingBalanceId === b.id}
                                        className="text-xs font-semibold text-[#c8a86b] hover:text-[#dfc28d] underline cursor-pointer transition-colors self-start sm:self-auto"
                                      >
                                        Re-generate Link ↻
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => void handlePayBalance(b.id, false)}
                                    disabled={payingBalanceId === b.id}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#c8a86b] via-[#d4af37] to-[#b89552] hover:brightness-105 active:scale-[0.99] text-[#0b100d] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#c8a86b]/20 transition-all cursor-pointer disabled:opacity-60"
                                  >
                                    {payingBalanceId === b.id ? (
                                      <>
                                        <svg className="animate-spin h-4 w-4 text-[#0b100d]" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        <span>Opening Payment Page...</span>
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-4 h-4 text-[#0b100d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        <span>
                                          {b.hasPendingBalance
                                            ? `Resume & Pay Balance (${formatCad(b.paymentSummary.balanceDueCents)})`
                                            : `Pay Remaining Balance (${formatCad(b.paymentSummary.balanceDueCents)})`}
                                        </span>
                                        <span aria-hidden="true">↗</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}

                              {/* Primary Appreciation CTA if balance is settled */}
                              {b.paymentSummary.balanceDueCents <= 0 && (b.status === "completed" || b.status === "confirmed") && (
                                <div className="w-full">
                                  {b.paymentSummary.tipCents > 0 ? (
                                    <div className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-[#c8a86b]/10 to-emerald-500/10 border border-[#c8a86b]/35 flex items-center justify-between gap-2 text-xs shadow-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs shrink-0">✓</span>
                                        <span className="font-medium text-[var(--ink)] text-[11px] sm:text-xs">
                                          Gratuity Received: <strong className="font-mono font-bold text-[#c8a86b]">{formatCad(b.paymentSummary.tipCents)}</strong>
                                          <span className="text-[var(--ink-soft)] ml-1 hidden sm:inline">· Thank you for supporting our studio!</span>
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => void handleLeaveTip(b.id)}
                                        disabled={tippingBookingId === b.id}
                                        className="text-[11px] font-semibold text-[#c8a86b] hover:text-[#dfc28d] underline transition-colors cursor-pointer shrink-0"
                                      >
                                        {tippingBookingId === b.id ? "Opening..." : "+ Extra Tip"}
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => void handleLeaveTip(b.id)}
                                      disabled={tippingBookingId === b.id}
                                      className="w-full py-2.5 px-4 rounded-xl border border-[var(--gold)] bg-[var(--gold)]/15 hover:bg-[var(--gold)]/25 dark:bg-[var(--gold)]/20 dark:hover:bg-[var(--gold)]/30 text-xs font-semibold text-[#6e5015] dark:text-[#f3efe6] flex items-center justify-center gap-2 shadow-xs hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
                                    >
                                      <span className="text-amber-500 dark:text-amber-400">✨</span>
                                      <span>{tippingBookingId === b.id ? "Opening Tip Checkout..." : "Leave a Tip (Card) ↗"}</span>
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Secondary Actions Row */}
                              <div className="flex items-center gap-2">
                                {isUpcoming && b.status !== "cancelled" && (
                                  <button
                                    type="button"
                                    onClick={() => downloadIcs(b)}
                                    className="flex-1 py-2 px-3 rounded-xl border border-stone-300/80 dark:border-white/15 bg-white/90 dark:bg-white/5 hover:bg-stone-50 dark:hover:bg-white/10 text-xs font-semibold text-stone-800 dark:text-[#f3efe6] flex items-center justify-center gap-1.5 shadow-xs hover:border-stone-400 dark:hover:border-white/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                  >
                                    <svg className="w-3.5 h-3.5 text-[#c8a86b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Calendar</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => void handleViewInvoice(b.id)}
                                  className="flex-1 py-2 px-3 rounded-xl border border-stone-300/80 dark:border-white/15 bg-white/90 dark:bg-white/5 hover:bg-stone-50 dark:hover:bg-white/10 text-xs font-semibold text-stone-800 dark:text-[#f3efe6] flex items-center justify-center gap-1.5 shadow-xs hover:border-stone-400 dark:hover:border-white/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  <svg className="w-3.5 h-3.5 text-[#c8a86b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span>Invoice</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CALENDAR VIEW */}
            {appointmentView === "calendar" && (
              <div className="rounded-3xl border border-[var(--line-strong)]/25 bg-[var(--background)]/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
                {/* Month Selector */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl text-[var(--ink)]">
                    {format(calendarDate, "MMMM yyyy")}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCalendarDate((d) => subMonths(d, 1))}
                      className="p-2 rounded-xl border border-[var(--line)] bg-[var(--mist)]/40 hover:bg-[var(--mist)] text-[var(--ink)] transition-all cursor-pointer"
                      aria-label="Previous month"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarDate(new Date())}
                      className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--mist)]/40 hover:bg-[var(--mist)] text-xs text-[var(--ink)] font-medium transition-all cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarDate((d) => addMonths(d, 1))}
                      className="p-2 rounded-xl border border-[var(--line)] bg-[var(--mist)]/40 hover:bg-[var(--mist)] text-[var(--ink)] transition-all cursor-pointer"
                      aria-label="Next month"
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--ink-faint)] pb-2 border-b border-[var(--line-soft)]">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Grid of Days */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-2">
                  {calendarDays.map((day, idx) => {
                    const isCurMonth = isSameMonth(day, calendarDate);
                    const dayAppointments = appointments.filter((a) => isSameDay(new Date(a.start), day));
                    const isSelected = selectedCalendarDate && isSameDay(day, selectedCalendarDate);
                    const hasAppointments = dayAppointments.length > 0;
                    const isCurrentDay = isToday(day);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedCalendarDate(day)}
                        className={`min-h-[64px] sm:min-h-[84px] p-1.5 sm:p-2 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "border-[var(--gold)] bg-[var(--gold)]/10 ring-2 ring-[var(--gold)]/30"
                            : hasAppointments
                            ? "border-[var(--gold)]/40 bg-[var(--mist)]/60 hover:border-[var(--gold)]"
                            : "border-[var(--line-soft)]/50 bg-[var(--mist)]/20 hover:bg-[var(--mist)]/40"
                        } ${!isCurMonth ? "opacity-35" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs sm:text-sm font-medium rounded-full h-6 w-6 flex items-center justify-center ${
                              isCurrentDay
                                ? "bg-[var(--gold)] text-[var(--night)] font-bold shadow-sm"
                                : "text-[var(--ink)]"
                            }`}
                          >
                            {format(day, "d")}
                          </span>
                          {hasAppointments && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                          )}
                        </div>

                        {hasAppointments && (
                          <div className="mt-1 space-y-0.5">
                            {dayAppointments.slice(0, 2).map((a) => (
                              <div
                                key={a.id}
                                className="truncate text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-[var(--gold)]/20 text-[var(--gold)] font-medium"
                              >
                                {a.service?.name || "Appointment"}
                              </div>
                            ))}
                            {dayAppointments.length > 2 && (
                              <p className="text-[8px] text-[var(--ink-faint)]">
                                +{dayAppointments.length - 2} more
                              </p>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Day Details Panel */}
                {selectedCalendarDate && (
                  <div className="mt-6 pt-6 border-t border-[var(--line-soft)]">
                    <h4 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
                      Appointments on {format(selectedCalendarDate, "MMMM d, yyyy")}
                    </h4>
                    {appointmentsForSelectedDate.length === 0 ? (
                      <p className="mt-2 text-xs text-[var(--ink-soft)]">
                        No appointments scheduled on this day.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {appointmentsForSelectedDate.map((a) => (
                          <div
                            key={a.id}
                            className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--mist)]/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                          >
                            <div>
                              <p className="font-semibold text-sm text-[var(--ink)]">
                                {a.service?.name} ({format(new Date(a.start), "h:mm a")})
                              </p>
                              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                                Status: <strong className="capitalize">{a.status}</strong> · Paid: {formatCad(a.paymentSummary.paidCents)}
                                {a.paymentSummary.tipCents > 0 && (
                                  <span> · Tip: <strong className="font-mono text-[#c8a86b]">{formatCad(a.paymentSummary.tipCents)}</strong></span>
                                )}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => downloadIcs(a)}
                                className="px-3.5 py-1.5 rounded-xl border border-stone-300/80 dark:border-white/15 bg-white/90 dark:bg-white/5 hover:bg-stone-50 dark:hover:bg-white/10 text-xs font-semibold text-stone-800 dark:text-[#f3efe6] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                              >
                                Export .ics
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleViewInvoice(a.id)}
                                className="px-3.5 py-1.5 rounded-xl border border-stone-300/80 dark:border-white/15 bg-white/90 dark:bg-white/5 hover:bg-stone-50 dark:hover:bg-white/10 text-xs font-semibold text-stone-800 dark:text-[#f3efe6] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                              >
                                View Invoice
                              </button>
                              {a.paymentSummary.balanceDueCents > 0 && a.status !== "cancelled" ? (
                                <div className="flex items-center gap-2">
                                  {a.hasPendingBalance && (
                                    <button
                                      type="button"
                                      onClick={() => void handlePayBalance(a.id, true)}
                                      disabled={payingBalanceId === a.id}
                                      className="px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-semibold transition-all cursor-pointer"
                                      title="Re-generate fresh payment link"
                                    >
                                      ↻ New Link
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => void handlePayBalance(a.id, false)}
                                    disabled={payingBalanceId === a.id}
                                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#c8a86b] via-[#d4af37] to-[#b89552] text-[#0b100d] font-bold text-xs shadow-xs hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                                  >
                                    {payingBalanceId === a.id ? "Opening..." : `Pay Balance (${formatCad(a.paymentSummary.balanceDueCents)}) ↗`}
                                  </button>
                                </div>
                              ) : (
                                (a.status === "completed" || a.status === "confirmed") && (
                                  a.paymentSummary.tipCents > 0 ? (
                                    <span className="px-3 py-1.5 rounded-xl border border-[#c8a86b]/35 bg-[#c8a86b]/15 text-[#8b6521] dark:text-[#dfc28d] text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                                      <span className="text-emerald-500 font-bold">✓</span>
                                      <span>Tip: <strong className="font-mono">{formatCad(a.paymentSummary.tipCents)}</strong></span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => void handleLeaveTip(a.id)}
                                      disabled={tippingBookingId === a.id}
                                      className="px-3 py-1.5 rounded-xl border border-[var(--gold)] bg-[var(--gold)]/15 hover:bg-[var(--gold)]/25 text-[#6e5015] dark:text-[#f3efe6] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <span>✨</span>
                                      <span>Tip ↗</span>
                                    </button>
                                  )
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYMENTS & INVOICES */}
        {!loading && activeTab === "payments" && (
          <div className="mt-8 space-y-6">
            {/* Quick Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--background)]/75 backdrop-blur-xl p-4 sm:p-5 shadow-sm">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium">
                  Total Spent
                </p>
                <p className="font-mono text-xl sm:text-2xl font-bold text-[var(--gold)] mt-1">
                  {formatCad(totalSpentCents)}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--background)]/75 backdrop-blur-xl p-4 sm:p-5 shadow-sm">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium">
                  Completed Receipts
                </p>
                <p className="font-mono text-xl sm:text-2xl font-bold text-[var(--ink)] mt-1">
                  {completedPayments.length}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-2xl border border-[var(--line)] bg-[var(--background)]/75 backdrop-blur-xl p-4 sm:p-5 shadow-sm">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium">
                  Appointments Booked
                </p>
                <p className="font-mono text-xl sm:text-2xl font-bold text-[var(--ink)] mt-1">
                  {appointments.length}
                </p>
              </div>
            </div>

            {/* Payments Table / List */}
            <div className="rounded-3xl border border-[var(--line-strong)]/25 bg-[var(--background)]/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                    Payment History & Invoices
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] mt-1">
                    Download official studio receipts and invoices for completed treatments and gratuities.
                  </p>
                </div>
              </div>

              {completedPayments.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--ink-soft)]">
                  No completed payment receipts found yet. Once your deposit or balance payment is completed, your official receipts will appear here.
                </div>
              ) : (
                <div className="divide-y divide-[var(--line-soft)]">
                  {completedPayments.map((p) => {
                    const targetInvoiceId = p.bookingId || p.chargeId || p.id;
                    return (
                      <div
                        key={p.id}
                        className="py-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-[var(--ink)]">
                              {p.description}
                            </span>
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[var(--leaf)]/15 text-[var(--leaf)] border border-[var(--leaf)]/30">
                              {p.status}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--ink-soft)] mt-1">
                            {format(new Date(p.date), "MMMM d, yyyy · h:mm a")} · Method: <span className="uppercase">{p.method}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <span className="font-mono text-base font-semibold text-[var(--ink)]">
                            {formatCad(p.amountCents)}
                          </span>

                          <button
                            type="button"
                            onClick={() => void handleViewInvoice(targetInvoiceId)}
                            className="px-3.5 py-2 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 text-xs text-[var(--gold)] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Invoice
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MY PROFILE */}
        {!loading && activeTab === "profile" && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="rounded-3xl border border-[var(--line-strong)]/30 bg-[var(--background)]/85 backdrop-blur-2xl p-7 sm:p-10 shadow-xl">
              <div>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-[var(--gold)]">
                  Account Settings
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-[var(--ink)] mt-1">
                  Client Profile
                </h3>
                <p className="text-xs text-[var(--ink-soft)] mt-1.5 leading-relaxed">
                  Update your contact details below. Changes to your email address automatically synchronize across all your past and upcoming studio appointments.
                </p>
              </div>

              {profileSuccess && (
                <div className="mt-5 p-3.5 rounded-2xl bg-[var(--leaf)]/15 border border-[var(--leaf)]/30 text-[var(--leaf)] text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="mt-5 p-3.5 rounded-2xl bg-[var(--blush)]/10 border border-[var(--blush)]/30 text-[var(--blush)] text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--line)] bg-[var(--mist)]/40 px-4 py-3 text-sm text-[var(--ink)] focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/25 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--line)] bg-[var(--mist)]/40 px-4 py-3 text-sm text-[var(--ink)] focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/25 transition-all"
                  />
                  <p className="mt-1.5 text-[11px] text-[var(--ink-faint)]">
                    This email is used to log into your portal and receives your booking notifications.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      value={profileCountryCode}
                      onChange={(e) => setProfileCountryCode(e.target.value)}
                      placeholder="+1"
                      className="w-full rounded-2xl border border-[var(--line)] bg-[var(--mist)]/40 px-4 py-3 text-sm text-[var(--ink)] focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/25 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="(780) 555-0123"
                      className="w-full rounded-2xl border border-[var(--line)] bg-[var(--mist)]/40 px-4 py-3 text-sm text-[var(--ink)] focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/25 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={profileUpdating}
                    className="btn-primary w-full !py-3.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {profileUpdating ? "Saving Changes..." : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* PRINTABLE INVOICE MODAL */}
      {activeInvoice && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveInvoice(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto print:static print:inset-auto print:z-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:h-auto"
        >
          {/* Ambient aurora glow & signature celebratory confetti cascade matching the deposit screen */}
          <div className="aurora pointer-events-none print:hidden fixed inset-0 opacity-70" />
          <ConfettiEffect mode="fixed" />

          <div className="relative w-full max-w-2xl my-3 sm:my-6 print:m-0 print:p-0 print:max-w-none print:w-full z-10">
            <LuxuryInvoiceReceipt
              number={activeInvoice.number}
              date={activeInvoice.date}
              status={activeInvoice.status}
              paymentMethod={activeInvoice.paymentMethod}
              merchant={activeInvoice.merchant}
              client={activeInvoice.client}
              appointment={activeInvoice.appointment}
              reconciliation={
                activeInvoice.reconciliation || {
                  treatmentTotalCents: activeInvoice.subtotalCents,
                  depositPaidCents: 0,
                  balancePaidCents: activeInvoice.subtotalCents,
                  tipCents: activeInvoice.tipCents,
                  discountCents: activeInvoice.discountCents,
                  totalPaidToDateCents: activeInvoice.paidCents,
                  balanceDueCents: activeInvoice.balanceDueCents,
                }
              }
              isModal={true}
              onClose={() => setActiveInvoice(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
