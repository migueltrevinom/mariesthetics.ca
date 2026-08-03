"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { format, addDays, parseISO, isToday, isTomorrow } from "date-fns";
import { formatCad } from "@/lib/money";

type Service = {
  _id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  depositCents: number;
  category?: string;
  photos?: string[];
  images?: { url: string }[];
};

type Slot = { start: string; end: string };

type Step = "service" | "slot" | "details" | "pay" | "done";

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  facial: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800",
  lashes: "https://images.unsplash.com/photo-1583001809873-a1284d563572?auto=format&fit=crop&q=80&w=800",
  brows: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
  waxing: "https://images.unsplash.com/photo-1512290900673-7002fa43878b?auto=format&fit=crop&q=80&w=800",
  general: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
};

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Treatments",
  facial: "Facials",
  lashes: "Lashes",
  brows: "Brows",
  waxing: "Waxing",
};

function formatSlotTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m === 0 ? "00" : m} ${ampm}`;
}

export function BookingWizard({ initialServiceId }: { initialServiceId?: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [activeCategory, setActiveCategory] = useState("all");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedStart, setSelectedStart] = useState("");
  const [step, setStep] = useState<Step>("service");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [depositMethod, setDepositMethod] = useState<"stripe" | "etransfer">("stripe");
  const [bookingId, setBookingId] = useState("");
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [encourageAccount, setEncourageAccount] = useState(false);

  const selectedService = useMemo(
    () => services.find((s) => s._id === serviceId),
    [services, serviceId]
  );

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        setServices(data.services ?? []);
        if (initialServiceId) {
          setServiceId(initialServiceId);
          setStep("slot");
        }
      })
      .catch(() => setError("Could not load services. Is MongoDB connected?"));
  }, [initialServiceId]);

  useEffect(() => {
    if (!serviceId || step !== "slot") return;
    setLoading(true);
    setSelectedStart("");
    fetch(`/api/bookings/availability?serviceId=${serviceId}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? []);
      })
      .catch(() => setError("Could not load availability"))
      .finally(() => setLoading(false));
  }, [serviceId, date, step]);

  async function createBooking() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          start: selectedStart,
          depositMethod,
          guest: { name, email, phone },
          couponCode: couponCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      setBookingId(data.booking._id);
      setHoldExpiresAt(data.booking.holdExpiresAt ?? null);

      if (depositMethod === "stripe") {
        const payRes = await fetch("/api/payments/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: data.booking._id }),
        });
        const payData = await payRes.json();
        if (!payRes.ok) {
          setError(
            `Stripe Deposit Issue: ${payData.error || "Please check your Stripe keys in .env"}. You can also choose Interac e-Transfer below.`
          );
          setStep("pay");
        } else if (payData.checkoutUrl) {
          setMessage("Redirecting to secure Stripe Checkout...");
          window.location.href = payData.checkoutUrl;
        } else {
          setMessage(
            `Deposit Payment session created (${formatCad(payData.amountCents)}). Instant confirmation ready.`
          );
          setStep("done");
          setEncourageAccount(true);
        }
      } else {
        setMessage(
          "Your slot is held for 2 hours. Send Interac e-Transfer for the deposit, then submit proof below."
        );
        setStep("pay");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitProof() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: proofNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(data.message);
      setStep("done");
      setEncourageAccount(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function requestAccountOtp() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, phone, purpose: "link_account" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(
        data.devCode
          ? `Account code sent (dev): ${data.devCode}. Verify on the client login page.`
          : "Check your email for a login code to save your booking history."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  // Generate 14 available dates starting today
  const dates = Array.from({ length: 14 }, (_, i) =>
    format(addDays(new Date(), i), "yyyy-MM-dd")
  );

  const morningSlots = slots.filter((s) => new Date(s.start).getHours() < 12);
  const afternoonSlots = slots.filter((s) => new Date(s.start).getHours() >= 12);

  const STEPS: Step[] = ["service", "slot", "details", "pay", "done"];
  const STEP_LABELS: Record<Step, string> = {
    service: "1. Service",
    slot: "2. Date & Slot",
    details: "3. Guest Details",
    pay: "4. Deposit",
    done: "5. Confirmed",
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map((s) => s.category || "general")));
    return ["all", ...cats];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (activeCategory === "all") return services;
    return services.filter((s) => (s.category || "general") === activeCategory);
  }, [services, activeCategory]);

  return (
    <div className="w-full text-left space-y-8">
      {/* High-End Luxury Step Breadcrumb Bar */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-4 sm:p-5 rounded-2xl shadow-sm">
        <ol className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-wider">
          {STEPS.map((s, idx) => {
            const isActive = step === s;
            const isPassed = STEPS.indexOf(step) > idx;
            return (
              <li
                key={s}
                className={`flex items-center gap-2 font-medium transition-all ${
                  isActive
                    ? "text-[#c8a86b] font-bold"
                    : isPassed
                    ? "text-leaf"
                    : "text-[var(--ink-soft)] opacity-60"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border ${
                    isActive
                      ? "border-[#c8a86b] bg-[#c8a86b]/10 text-[#c8a86b] font-bold"
                      : isPassed
                      ? "border-leaf bg-leaf/10 text-leaf"
                      : "border-[var(--border-color)] bg-black/5"
                  }`}
                >
                  {isPassed ? "✓" : idx + 1}
                </span>
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
                {idx < STEPS.length - 1 && (
                  <span className="text-[var(--border-color)] hidden sm:inline ml-2">/</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {error && (
        <div className="border border-blush/30 bg-blush/10 p-4 rounded-xl text-xs text-blush font-semibold flex items-center gap-2">
          <span>✕</span> <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="border border-leaf/30 bg-leaf/10 p-4 rounded-xl text-xs text-leaf font-semibold flex items-center gap-2">
          <span>✓</span> <span>{message}</span>
        </div>
      )}

      {/* ── STEP 1: SERVICE SELECTION SHOWCASE ── */}
      {step === "service" && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          {categories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[var(--border-color)]">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCategory(c)}
                  className={`chip font-medium text-xs ${
                    activeCategory === c
                      ? "!border-[#c8a86b] !text-[#c8a86b] !bg-[#c8a86b]/10 font-bold"
                      : ""
                  }`}
                >
                  {CATEGORY_LABELS[c] ?? c}
                </button>
              ))}
            </div>
          )}

          {/* Spacious Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredServices.map((service) => {
              const cat = service.category || "general";
              const photoUrl =
                service.photos && service.photos.length > 0
                  ? service.photos[0]
                  : service.images && service.images.length > 0
                  ? service.images[0].url
                  : CATEGORY_FALLBACK_IMAGES[cat] || CATEGORY_FALLBACK_IMAGES.general;

              return (
                <div
                  key={service._id}
                  className="group border border-[var(--border-color)] bg-[var(--card-bg)] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#c8a86b]/50 transition-all duration-500 flex flex-col justify-between"
                >
                  {/* Photo Thumbnail */}
                  <div className="relative w-full h-56 overflow-hidden bg-black/10">
                    <Image
                      src={photoUrl}
                      alt={service.name}
                      fill
                      unoptimized={photoUrl.includes("pinata") || photoUrl.includes("ipfs")}
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                      <span className="bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
                        {cat}
                      </span>
                      <span className="bg-[#c8a86b]/90 backdrop-blur-md text-[#24180a] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        ⏱ {service.durationMin} MINS
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-5 right-5">
                      <h3 className="font-[family-name:var(--font-display)] text-2xl text-white tracking-tight leading-tight">
                        {service.name}
                      </h3>
                    </div>
                  </div>

                  {/* Body & CTA */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                    <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                      {service.description || "A personalized beauty treatment crafted to enhance your natural features and revitalize your skin in a serene Edmonton studio."}
                    </p>

                    <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-faint)] block">
                          Deposit: {formatCad(service.depositCents)}
                        </span>
                        <span className="gold-text text-2xl font-bold tracking-tight">
                          {formatCad(service.priceCents)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setServiceId(service._id);
                          setStep("slot");
                        }}
                        className="btn-primary text-xs !py-2.5 !px-5 shadow-md cursor-pointer hover:scale-105 transition-all"
                      >
                        Select Treatment →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="py-12 text-center text-sm text-[var(--ink-soft)] italic">
              No services found in this category.
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: DATE & SLOT SELECTION ── */}
      {step === "slot" && selectedService && (
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
            <button
              type="button"
              className="text-xs text-[#c8a86b] hover:underline font-semibold cursor-pointer"
              onClick={() => setStep("service")}
            >
              ← Back to All Services
            </button>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-faint)] block">
                Selected Service
              </span>
              <span className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                {selectedService.name} ({selectedService.durationMin} mins)
              </span>
            </div>
          </div>

          {/* Date Picker Strip */}
          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-wider font-bold text-[var(--ink-soft)]">
              1. Select Date
            </label>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {dates.map((d) => {
                const isSelected = date === d;
                const dayDate = parseISO(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    className={`flex-shrink-0 flex flex-col items-center py-3 px-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer min-w-[65px] ${
                      isSelected
                        ? "border-[#c8a86b] bg-[#c8a86b]/15 text-[var(--ink)] shadow-sm font-bold"
                        : "border-[var(--border-color)] bg-white/[0.01] text-[var(--ink-soft)] hover:border-[#c8a86b]/50 hover:text-[var(--ink)]"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#c8a86b]">
                      {format(dayDate, "EEE")}
                    </span>
                    <span className={`text-xl font-bold mt-0.5 ${isSelected ? "text-[#c8a86b]" : ""}`}>
                      {format(dayDate, "d")}
                    </span>
                    <span className="text-[9px] uppercase tracking-wide opacity-70">
                      {format(dayDate, "MMM")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slot Selection */}
          <div className="space-y-4 pt-2">
            <label className="block text-xs uppercase tracking-wider font-bold text-[var(--ink-soft)]">
              2. Select Available Time Slot
            </label>

            {loading ? (
              <div className="py-8 text-center text-xs text-[var(--ink-soft)] animate-pulse">
                Checking studio availability...
              </div>
            ) : slots.length === 0 ? (
              <div className="py-8 text-center text-xs text-blush border border-blush/20 bg-blush/5 rounded-2xl">
                No open slots available on this date. Please select another date.
              </div>
            ) : (
              <div className="space-y-5">
                {morningSlots.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-[#c8a86b] uppercase tracking-wider">
                      Morning Slots
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {morningSlots.map((s) => {
                        const isSelected = selectedStart === s.start;
                        return (
                          <button
                            key={s.start}
                            type="button"
                            onClick={() => setSelectedStart(s.start)}
                            className={`py-3 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                              isSelected
                                ? "border-[#c8a86b] bg-[#c8a86b]/20 text-[var(--ink)] font-bold shadow-md"
                                : "border-[var(--border-color)] bg-white/[0.02] text-[var(--ink-soft)] hover:border-[#c8a86b]"
                            }`}
                          >
                            {formatSlotTime(s.start)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {afternoonSlots.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-[#c8a86b] uppercase tracking-wider">
                      Afternoon &amp; Evening Slots
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {afternoonSlots.map((s) => {
                        const isSelected = selectedStart === s.start;
                        return (
                          <button
                            key={s.start}
                            type="button"
                            onClick={() => setSelectedStart(s.start)}
                            className={`py-3 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                              isSelected
                                ? "border-[#c8a86b] bg-[#c8a86b]/20 text-[var(--ink)] font-bold shadow-md"
                                : "border-[var(--border-color)] bg-white/[0.02] text-[var(--ink-soft)] hover:border-[#c8a86b]"
                            }`}
                          >
                            {formatSlotTime(s.start)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[var(--border-color)] flex justify-end">
            <button
              type="button"
              disabled={!selectedStart}
              onClick={() => setStep("details")}
              className="btn-primary text-xs !py-3 !px-8 disabled:opacity-40 cursor-pointer"
            >
              Continue to Guest Details →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: GUEST DETAILS ── */}
      {step === "details" && selectedService && (
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
            <button
              type="button"
              className="text-xs text-[#c8a86b] hover:underline font-semibold cursor-pointer"
              onClick={() => setStep("slot")}
            >
              ← Change Time Slot
            </button>
            <span className="text-xs text-[var(--ink-soft)]">
              {format(parseISO(selectedStart), "PPP · p")}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-4 py-3 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                Email Address * (For appointment confirmation)
              </label>
              <input
                type="email"
                required
                placeholder="sarah@example.com"
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-4 py-3 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                Phone Number (optional)
              </label>
              <input
                type="tel"
                placeholder="(780)1112223"
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-4 py-3 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                Promo Code / Coupon (optional)
              </label>
              <input
                type="text"
                placeholder="PROMO2026"
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-4 py-3 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-color)] flex justify-end">
            <button
              type="button"
              disabled={!name || !email}
              onClick={() => setStep("pay")}
              className="btn-primary text-xs !py-3 !px-8 disabled:opacity-40 cursor-pointer"
            >
              Continue to Deposit →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: DEPOSIT & PAYMENT METHOD ── */}
      {step === "pay" && selectedService && (
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
            <button
              type="button"
              className="text-xs text-[#c8a86b] hover:underline font-semibold cursor-pointer"
              onClick={() => setStep("details")}
            >
              ← Back to Guest Details
            </button>
            <span className="text-xs text-[var(--ink-soft)]">{name} ({email})</span>
          </div>

          {/* Pricing breakdown box */}
          <div className="p-4 border border-[#c8a86b]/30 bg-[#c8a86b]/5 rounded-2xl space-y-2 text-xs text-[var(--ink)]">
            <div className="flex justify-between">
              <span className="text-[var(--ink-soft)]">Treatment Total:</span>
              <span className="font-medium">{formatCad(selectedService.priceCents)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#c8a86b]">
              <span>Deposit Required Today:</span>
              <span>{formatCad(selectedService.depositCents)}</span>
            </div>
            <div className="flex justify-between text-[var(--ink-soft)] border-t border-[#c8a86b]/20 pt-2">
              <span>Balance Due at Appointment:</span>
              <span>{formatCad(selectedService.priceCents - selectedService.depositCents)}</span>
            </div>
          </div>

          {/* Deposit Method Selector */}
          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-wider font-bold text-[var(--ink-soft)]">
              Choose Deposit Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDepositMethod("stripe")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  depositMethod === "stripe"
                    ? "border-[#c8a86b] bg-[#c8a86b]/15 text-[var(--ink)] font-bold shadow-md"
                    : "border-[var(--border-color)] bg-white/[0.01] text-[var(--ink-soft)]"
                }`}
              >
                <p className="font-semibold text-sm">💳 Stripe / Credit Card</p>
                <p className="text-[11px] text-[var(--ink-soft)] mt-1">
                  Instant confirmation with Visa, Mastercard, or Apple Pay.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDepositMethod("etransfer")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  depositMethod === "etransfer"
                    ? "border-[#c8a86b] bg-[#c8a86b]/15 text-[var(--ink)] font-bold shadow-md"
                    : "border-[var(--border-color)] bg-white/[0.01] text-[var(--ink-soft)]"
                }`}
              >
                <p className="font-semibold text-sm">📲 Interac e-Transfer</p>
                <p className="text-[11px] text-[var(--ink-soft)] mt-1">
                  Slot held for 2 hours while e-Transfer deposit is verified.
                </p>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-color)] flex justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={createBooking}
              className="btn-primary text-xs !py-3.5 !px-8 disabled:opacity-40 cursor-pointer shadow-lg"
            >
              {loading ? "Processing..." : `Reserve & Pay Deposit (${formatCad(selectedService.depositCents)}) →`}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5: CONFIRMATION ── */}
      {step === "done" && (
        <div className="border border-leaf/30 bg-leaf/5 p-8 rounded-3xl space-y-6 text-center shadow-md">
          <div className="w-14 h-14 bg-leaf/20 text-leaf border border-leaf/40 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
            ✓
          </div>
          <div className="space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
              Appointment Reserved!
            </h2>
            <p className="text-sm text-[var(--ink-soft)] max-w-md mx-auto">
              {message}
            </p>
          </div>

          {holdExpiresAt && depositMethod === "etransfer" && (
            <div className="p-4 border border-[#c8a86b]/30 bg-[#c8a86b]/10 rounded-2xl text-xs space-y-2 text-left">
              <p className="font-semibold text-[#c8a86b]">e-Transfer Instructions:</p>
              <p className="text-[var(--ink-soft)]">
                Send deposit to <strong className="text-[var(--ink)]">mari@mariesthetics.ca</strong>.
              </p>
              <p className="text-[var(--ink-soft)]">
                Hold expires at: {format(parseISO(holdExpiresAt), "PPP · p")}
              </p>
              
              <div className="pt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter e-Transfer Reference / Proof Note"
                  className="flex-1 border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 rounded-xl text-xs"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                />
                <button
                  type="button"
                  onClick={submitProof}
                  className="btn-primary text-xs !py-2 !px-4"
                >
                  Submit Proof
                </button>
              </div>
            </div>
          )}

          {encourageAccount && (
            <div className="pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={requestAccountOtp}
                className="text-xs text-[#c8a86b] hover:underline font-semibold"
              >
                Send login code to save this booking in your client portal →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
