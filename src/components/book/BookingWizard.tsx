"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format, addDays, parseISO } from "date-fns";
import { formatCad } from "@/lib/money";
import { COUNTRY_CODES } from "@/lib/constants/countryCodes";
import { getFastIpfsUrl } from "@/lib/ipfs";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { getLocalizedService } from "@/lib/i18n/serviceTranslations";

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
  facials: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800",
  facial: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800",
  lashes: "https://images.unsplash.com/photo-1583001809873-a1284d563572?auto=format&fit=crop&q=80&w=800",
  permanentMakeUp: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
  brows: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
  general: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
};

const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
  all: "All Treatments",
  facials: "Facials",
  lashes: "Lashes",
  permanentMakeUp: "Permanent Make-Up",
  general: "General",
};

function formatSlotTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m === 0 ? "00" : m} ${ampm}`;
}

export function BookingWizard({
  initialServiceId,
  initialServiceSlug,
  initialDate,
  initialTime,
  initialCouponCode,
}: {
  initialServiceId?: string;
  initialServiceSlug?: string;
  initialDate?: string;
  initialTime?: string;
  initialCouponCode?: string;
}) {
  const { locale, t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [activeCategory, setActiveCategory] = useState("all");
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(DEFAULT_CATEGORY_LABELS);

  useEffect(() => {
    fetch("/api/public/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          const map: Record<string, string> = { all: "All Treatments" };
          data.categories.forEach((c: any) => {
            map[c.slug] = c.name;
          });
          setCategoryLabels(map);
        }
      })
      .catch(() => {});
  }, []);

  const [date, setDate] = useState(initialDate || format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedStart, setSelectedStart] = useState("");
  const [step, setStep] = useState<Step>("service");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [couponCode, setCouponCode] = useState(initialCouponCode?.toUpperCase().trim() ?? "");
  const [couponMessage, setCouponMessage] = useState("");
  const [validatedCoupon, setValidatedCoupon] = useState<{
    kind: "coupon" | "gift_card";
    code: string;
    type: "fixed" | "percent";
    value: number;
    remainingBalanceCents?: number;
    recipientName?: string;
    recipientEmail?: string;
    message: string;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [depositMethod, setDepositMethod] = useState<"stripe" | "etransfer">("stripe");
  const [bookingId, setBookingId] = useState("");
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [encourageAccount, setEncourageAccount] = useState(false);
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user?.role === "client") {
          setIsClientLoggedIn(true);
          if (data.user.email) setEmail((prev) => prev || data.user.email);
          if (data.user.name) {
            const parts = data.user.name.trim().split(" ");
            const fName = parts[0] || "";
            const lName = parts.slice(1).join(" ") || "";
            setFirstName((prev) => prev || fName);
            setLastName((prev) => prev || lName);
          }
        }
      })
      .catch(() => {});
  }, []);

  const selectedService = useMemo(
    () => services.find((s) => s._id === serviceId),
    [services, serviceId]
  );

  const name = useMemo(
    () => [firstName.trim(), lastName.trim()].filter(Boolean).join(" "),
    [firstName, lastName]
  );

  async function validatePromoCode(rawCode: string, targetServiceId?: string, autoFillClient = true) {
    const code = rawCode.toUpperCase().trim();
    if (!code) {
      setValidatedCoupon(null);
      setCouponMessage("");
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const qs = new URLSearchParams({ code });
      const sId = targetServiceId || serviceId;
      if (sId) qs.set("serviceId", sId);
      if (email) qs.set("email", email);

      const res = await fetch(`/api/public/coupons/validate?${qs.toString()}`);
      const data = await res.json();

      if (data.success) {
        setValidatedCoupon({
          kind: data.kind,
          code: data.code,
          type: data.type,
          value: data.value,
          remainingBalanceCents: data.remainingBalanceCents,
          recipientName: data.recipientName,
          recipientEmail: data.recipientEmail,
          message: data.message,
        });
        setCouponMessage(data.message);

        // Pre-fill recipient name and email if provided by the gift certificate
        if (autoFillClient) {
          if (data.recipientName) {
            const parts = String(data.recipientName).trim().split(/\s+/);
            const fName = parts[0] || "";
            const lName = parts.slice(1).join(" ") || "";
            if (fName) setFirstName(fName);
            if (lName) setLastName(lName);
          }
          if (data.recipientEmail) {
            setEmail(data.recipientEmail);
          }
        }
      } else {
        setValidatedCoupon(null);
        setCouponMessage(data.error || "Invalid coupon or gift voucher code");
      }
    } catch {
      setValidatedCoupon(null);
      setCouponMessage("Could not validate coupon code");
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  // Auto-validate coupon code as user types or pastes with debounce
  useEffect(() => {
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) {
      if (validatedCoupon) {
        setValidatedCoupon(null);
        setCouponMessage("");
      }
      return;
    }

    if (validatedCoupon?.code === trimmed) return;
    if (trimmed.length < 5) return;

    const timer = setTimeout(() => {
      void validatePromoCode(trimmed, serviceId, true);
    }, 450);

    return () => clearTimeout(timer);
  }, [couponCode, serviceId, validatedCoupon?.code]);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        const loadedServices: Service[] = data.services ?? [];
        setServices(loadedServices);

        let targetServiceId = initialServiceId || "";
        if (!targetServiceId && initialServiceSlug) {
          const match = loadedServices.find((s: any) => s.slug === initialServiceSlug);
          if (match) targetServiceId = match._id;
        }

        if (targetServiceId || initialDate) {
          if (targetServiceId) setServiceId(targetServiceId);
          else if (loadedServices.length > 0) setServiceId(loadedServices[0]._id);
          if (initialDate) setDate(initialDate);
          setStep("slot");
        }
      })
      .catch(() => setError("Could not load services. Is MongoDB connected?"));
  }, [initialServiceId, initialServiceSlug, initialDate]);

  // Validate initial coupon from URL param on mount
  useEffect(() => {
    const code = initialCouponCode?.toUpperCase().trim();
    if (!code) return;
    setCouponCode(code);
    void validatePromoCode(code, serviceId, true);
  }, [initialCouponCode]);

  // Re-calculate coupon discount if serviceId changes
  useEffect(() => {
    if (couponCode && serviceId) {
      void validatePromoCode(couponCode, serviceId, false);
    }
  }, [serviceId]);

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

  // Dynamic Financial Calculations including Coupon / Gift Card
  const {
    totalTreatmentCents,
    couponDiscountCents,
    netPriceCents,
    depositDueCents,
    remainingBalanceCents,
    isFullyCovered,
    remainingGiftCardBalanceCents,
  } = useMemo(() => {
    if (!selectedService) {
      return {
        totalTreatmentCents: 0,
        couponDiscountCents: 0,
        netPriceCents: 0,
        depositDueCents: 0,
        remainingBalanceCents: 0,
        isFullyCovered: false,
        remainingGiftCardBalanceCents: 0,
      };
    }

    const total = selectedService.priceCents;
    const normalDeposit = selectedService.depositCents;

    let discount = 0;
    let remainingGcBalance = 0;

    if (validatedCoupon) {
      if (validatedCoupon.kind === "gift_card") {
        const availableCents =
          validatedCoupon.remainingBalanceCents ?? Math.round(validatedCoupon.value * 100);
        discount = Math.min(availableCents, total);
        remainingGcBalance = Math.max(0, availableCents - discount);
      } else if (validatedCoupon.kind === "coupon") {
        if (validatedCoupon.type === "percent") {
          discount = Math.round((total * validatedCoupon.value) / 100);
        } else {
          discount = Math.min(Math.round(validatedCoupon.value * 100), total);
        }
      }
    }

    const net = Math.max(0, total - discount);
    const isFullyCovered = net === 0;

    // Deposit is $0 if fully covered, otherwise capped at remaining net total
    const deposit = isFullyCovered ? 0 : Math.min(normalDeposit, net);
    const remaining = Math.max(0, net - deposit);

    return {
      totalTreatmentCents: total,
      couponDiscountCents: discount,
      netPriceCents: net,
      depositDueCents: deposit,
      remainingBalanceCents: remaining,
      isFullyCovered,
      remainingGiftCardBalanceCents: remainingGcBalance,
    };
  }, [selectedService, validatedCoupon]);

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
          depositMethod: isFullyCovered ? "other" : depositMethod,
          guest: { name, email, countryCode, phone },
          couponCode: couponCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      setBookingId(data.booking._id);
      setHoldExpiresAt(data.booking.holdExpiresAt ?? null);

      // If fully covered by gift card or deposit is 0, instant confirmation!
      if (isFullyCovered || depositDueCents === 0 || data.next?.action === "none") {
        setMessage(
          data.next?.message || "Your appointment is confirmed! 100% covered by your gift voucher."
        );
        setStep("done");
        setEncourageAccount(true);
        return;
      }

      if (depositMethod === "stripe") {
        const payRes = await fetch("/api/payments/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: data.booking._id }),
        });
        const payData = await payRes.json();
        if (!payRes.ok) {
          setError(
            `Deposit Payment Issue: ${payData.error || "Please check your payment details or choose Interac e-Transfer below."}`
          );
          setStep("pay");
        } else if (payData.checkoutUrl) {
          setMessage("Redirecting to secure card checkout...");
          window.location.href = payData.checkoutUrl;
        } else {
          setMessage(
            `Deposit payment session ready (${formatCad(payData.amountCents)}). Instant confirmation.`
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
      setMessage("A login code has been sent to your email to access your client portal.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  // ⚡ Performance Optimization (Bolt):
  // Memoize 14-day date array generation to avoid re-instantiating Date objects and re-formatting on every re-render.
  const dates = useMemo(
    () => Array.from({ length: 14 }, (_, i) => format(addDays(new Date(), i), "yyyy-MM-dd")),
    []
  );

  // ⚡ Performance Optimization (Bolt):
  // Categorize slots in a single pass with useMemo([slots]) to prevent parsing ISO date strings
  // and re-filtering arrays on every keystroke/render during form input.
  const { morningSlots, afternoonSlots } = useMemo(() => {
    const morning: Slot[] = [];
    const afternoon: Slot[] = [];
    for (const s of slots) {
      if (new Date(s.start).getHours() < 12) {
        morning.push(s);
      } else {
        afternoon.push(s);
      }
    }
    return { morningSlots: morning, afternoonSlots: afternoon };
  }, [slots]);

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
          {/* Active Voucher Banner on Step 1 */}
          {validatedCoupon && (
            <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-[#c8a86b]/40 bg-[#c8a86b]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#c8a86b]/20 text-[#c8a86b] border border-[#c8a86b]/30 flex items-center justify-center font-bold text-base shrink-0">
                  ✓
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#c8a86b]">
                      {validatedCoupon.kind === "gift_card" ? "Gift Certificate Active" : "Promo Code Active"}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#c8a86b] bg-black/30 px-2.5 py-0.5 rounded-md border border-[#c8a86b]/20">
                      {validatedCoupon.code}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                    {validatedCoupon.kind === "gift_card" ? (
                      <>
                        Available Balance: <strong className="text-[var(--ink)] font-semibold">{formatCad(validatedCoupon.remainingBalanceCents ?? validatedCoupon.value * 100)} CAD</strong>
                        {validatedCoupon.recipientName ? ` · Dedicated to ${validatedCoupon.recipientName}` : ""}
                      </>
                    ) : (
                      <>
                        Discount: <strong className="text-[var(--ink)] font-semibold">{validatedCoupon.message}</strong>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-[#c8a86b] font-semibold bg-[#c8a86b]/15 px-3.5 py-1.5 rounded-full border border-[#c8a86b]/30 w-fit shrink-0">
                Choose your treatment below
              </span>
            </div>
          )}

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
                  {categoryLabels[c] ?? c}
                </button>
              ))}
            </div>
          )}

          {/* Spacious Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredServices.map((service) => {
              const localized = getLocalizedService(service, locale);
              const cat = service.category || "general";
              const rawPhotoUrl =
                service.photos && service.photos.length > 0
                  ? service.photos[0]
                  : service.images && service.images.length > 0
                  ? service.images[0].url
                  : CATEGORY_FALLBACK_IMAGES[cat] || CATEGORY_FALLBACK_IMAGES.general;
              const photoUrl = getFastIpfsUrl(rawPhotoUrl);

              const isServiceCoveredByVoucher =
                validatedCoupon &&
                validatedCoupon.kind === "gift_card" &&
                (validatedCoupon.remainingBalanceCents ?? validatedCoupon.value * 100) >= service.priceCents;

              return (
                <div
                  key={service._id}
                  className="group border border-[var(--border-color)] bg-[var(--card-bg)] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#c8a86b]/50 transition-all duration-500 flex flex-col justify-between"
                >
                  {/* Photo Thumbnail */}
                  <div className="relative w-full h-56 overflow-hidden bg-black/10">
                    <Image
                      src={photoUrl}
                      alt={localized.name}
                      fill
                      loading="lazy"
                      decoding="async"
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
                        {localized.name}
                      </h3>
                    </div>
                  </div>

                  {/* Body & CTA */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                    <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                      {localized.description || "A personalized beauty treatment crafted to enhance your natural features and revitalize your skin in a serene Edmonton studio."}
                    </p>

                    <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between gap-3">
                      <div>
                        {isServiceCoveredByVoucher ? (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 block flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            100% Covered ($0.00 Deposit)
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-faint)] block">
                            {t("servicesPage.depositRequired") !== "servicesPage.depositRequired" ? t("servicesPage.depositRequired") : "Deposit Required:"} {formatCad(service.depositCents)}
                          </span>
                        )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="given-name"
                  placeholder="e.g. Sarah"
                  className="w-full border border-[var(--border-color)] bg-[var(--background)] px-4 py-3 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="family-name"
                  placeholder="e.g. Jenkins"
                  className="w-full border border-[var(--border-color)] bg-[var(--background)] px-4 py-3 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
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
                Phone Number (For SMS reminders)
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-36 border border-[var(--border-color)] bg-[var(--background)] px-3 py-3 rounded-xl text-sm font-semibold text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                >
                  {COUNTRY_CODES.map((c, i) => (
                    <option key={`${c.code}-${i}`} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="780 913 3081"
                  className="flex-1 border border-[var(--border-color)] bg-[var(--background)] px-4 py-3 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[var(--ink-soft)]">
                  Promo Code / Coupon (optional)
                </label>
                {validatedCoupon && (
                  <button
                    type="button"
                    onClick={() => {
                      setCouponCode("");
                      setValidatedCoupon(null);
                      setCouponMessage("");
                    }}
                    className="text-[11px] text-rose-500 hover:underline cursor-pointer font-medium"
                  >
                    Remove Code
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="MARI-GIFT-XXXXXX"
                  className="flex-1 uppercase font-mono border border-[var(--border-color)] bg-[var(--background)] px-4 py-3 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={couponCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setCouponCode(val);
                    if (!val) {
                      setValidatedCoupon(null);
                      setCouponMessage("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void validatePromoCode(couponCode, serviceId, true);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!couponCode.trim() || isValidatingCoupon}
                  onClick={() => validatePromoCode(couponCode, serviceId, true)}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#c8a86b] via-[#d4af37] to-[#b89552] text-[#0b100d] font-bold text-xs shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40"
                >
                  {isValidatingCoupon ? "Checking..." : validatedCoupon ? "Applied ✓" : "Apply"}
                </button>
              </div>

              {/* Status and Balance Feedback (Matching Screenshot 1) */}
              {isValidatingCoupon && (
                <p className="mt-2 text-xs text-[#c8a86b] animate-pulse">
                  Checking promo code &amp; voucher balance...
                </p>
              )}

              {validatedCoupon && (
                <div className="mt-2.5 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px]">✓</span>
                    <span>
                      {validatedCoupon.kind === "gift_card"
                        ? `Gift Voucher Balance: ${formatCad(validatedCoupon.remainingBalanceCents ?? validatedCoupon.value * 100)} CAD`
                        : `Promo Discount Active: ${validatedCoupon.message}`}
                    </span>
                  </div>
                  {validatedCoupon.recipientName && (
                    <span className="text-[11px] text-[var(--ink-soft)] font-medium">
                      Client: <strong className="text-[var(--ink)]">{validatedCoupon.recipientName}</strong>
                    </span>
                  )}
                </div>
              )}

              {!validatedCoupon && couponMessage && (
                <p className="mt-2 text-xs text-rose-500 font-medium flex items-center gap-1.5">
                  <span>✕</span> <span>{couponMessage}</span>
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-color)] flex justify-end">
            <button
              type="button"
              disabled={!firstName.trim() || !lastName.trim() || !email}
              onClick={() => setStep("pay")}
              className="btn-primary text-xs !py-3 !px-8 disabled:opacity-40 cursor-pointer"
            >
              {isFullyCovered ? "Continue to Confirmation (Fully Covered) →" : "Continue to Deposit →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: DEPOSIT & PAYMENT METHOD ── */}
      {step === "pay" && selectedService && (
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
          {/* Top Navigation & Client Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--border-color)]">
            <button
              type="button"
              className="text-xs text-[#c8a86b] hover:underline font-semibold cursor-pointer flex items-center gap-1"
              onClick={() => setStep("details")}
            >
              <span>←</span>
              <span>Back to Guest Details</span>
            </button>
            <div className="text-right">
              <span className="text-xs font-semibold text-[var(--ink)] block">{name}</span>
              <span className="text-[11px] text-[var(--ink-soft)]">{email}</span>
            </div>
          </div>

          {/* Reserved Treatment & Schedule Summary */}
          <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#c8a86b] block">
                Reserved Treatment
              </span>
              <h3 className="text-base font-bold text-[var(--ink)] mt-0.5">
                {getLocalizedService(selectedService, locale).name}
              </h3>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                ⏱ {selectedService.durationMin} minutes · Private 1-on-1 Studio Session in Edmonton
              </p>
            </div>
            {date && selectedStart && (
              <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--border-color)]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] block">
                  Date & Time
                </span>
                <span className="text-xs font-semibold text-[var(--ink)] block">
                  {date}
                </span>
                <span className="text-xs font-bold text-[#c8a86b]">
                  {formatSlotTime(selectedStart)}
                </span>
              </div>
            )}
          </div>

          {/* Pricing Breakdown: 4-Pillar (with Coupon/Voucher) or 3-Pillar Cards */}
          <div
            className={`grid grid-cols-1 ${
              couponDiscountCents > 0 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
            } gap-3`}
          >
            {/* 1. Total Price */}
            <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--background)] flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[var(--ink-soft)] uppercase tracking-wider">
                1. Total Treatment Price
              </span>
              <span className="text-xl font-bold text-[var(--ink)] mt-2">
                {formatCad(totalTreatmentCents)}
              </span>
              <span className="text-[10px] text-[var(--ink-soft)] mt-1">
                Full procedure cost
              </span>
            </div>

            {/* 2. Coupon / Gift Certificate Discount (shown when discount is present) */}
            {couponDiscountCents > 0 && (
              <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    {validatedCoupon?.kind === "gift_card" ? "2. Voucher Applied" : "2. Discount Applied"}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {validatedCoupon?.code}
                  </span>
                </div>
                <span className="text-xl font-bold text-emerald-400 mt-2">
                  -{formatCad(couponDiscountCents)}
                </span>
                <span className="text-[10px] text-emerald-300/80 mt-1">
                  {isFullyCovered ? "100% covers procedure" : "Deducted from treatment"}
                </span>
              </div>
            )}

            {/* 3. Deposit Due Today (Spotlight Tier) */}
            <div
              className={`p-4 rounded-2xl border-2 ${
                isFullyCovered
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-[#c8a86b] bg-[#c8a86b]/10"
              } flex flex-col justify-between relative shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold ${
                    isFullyCovered ? "text-emerald-400" : "text-[#c8a86b]"
                  } uppercase tracking-wider`}
                >
                  {couponDiscountCents > 0 ? "3. Deposit Due Today" : "2. Deposit Due Today"}
                </span>
                <span
                  className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full font-sans ${
                    isFullyCovered
                      ? "bg-emerald-500 text-black font-bold"
                      : "bg-[#c8a86b] text-black font-bold"
                  }`}
                >
                  {isFullyCovered ? "100% Covered" : "Locks Slot"}
                </span>
              </div>
              <span
                className={`text-2xl font-extrabold ${
                  isFullyCovered ? "text-emerald-400" : "text-[#c8a86b]"
                } mt-2`}
              >
                {formatCad(depositDueCents)}
              </span>
              <span className="text-[10px] text-[var(--ink)] font-semibold mt-1 flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isFullyCovered ? "bg-emerald-400" : "bg-[#c8a86b]"
                  }`}
                />
                {isFullyCovered ? "No deposit required" : "Deducted from your total"}
              </span>
            </div>

            {/* 4. Remaining Balance */}
            <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--background)] flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[var(--ink-soft)] uppercase tracking-wider">
                {couponDiscountCents > 0 ? "4. Remaining Balance" : "3. Remaining Balance"}
              </span>
              <span className="text-xl font-bold text-[var(--ink)] mt-2">
                {formatCad(remainingBalanceCents)}
              </span>
              <span className="text-[10px] text-[var(--ink-soft)] mt-1">
                {isFullyCovered ? "Fully settled with voucher" : "Pay at Edmonton studio after visit"}
              </span>
            </div>
          </div>

          {/* Clear Deposit & Policy Box */}
          <div className="p-4 sm:p-5 border border-[#c8a86b]/40 bg-[#c8a86b]/5 rounded-2xl space-y-2.5 text-xs text-[var(--ink)]">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
              <span className="text-base">📋</span>
              <span>{isFullyCovered ? "How your reservation works" : "How your reservation deposit works"}</span>
            </div>

            <ul className="space-y-2 text-[12px] leading-relaxed text-[var(--ink-soft)] pl-1">
              <li className="flex items-start gap-2">
                <span className="text-[#c8a86b] font-bold">✓</span>
                <span>
                  {isFullyCovered ? (
                    <>
                      <strong className="text-emerald-400 font-semibold">Covered by Gift Voucher:</strong> Your treatment is{" "}
                      <strong className="text-emerald-400 font-bold">100% covered</strong> by gift voucher{" "}
                      <strong className="font-mono text-[#c8a86b]">{validatedCoupon?.code}</strong>. No deposit or payment is required today.
                      {remainingGiftCardBalanceCents > 0 && (
                        <span>
                          {" "}A remaining balance of <strong className="text-[var(--ink)] font-bold">{formatCad(remainingGiftCardBalanceCents)}</strong> remains saved on your certificate for future visits.
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <strong className="text-[var(--ink)] font-semibold">Credited to your final total:</strong> Your{" "}
                      <strong className="text-[#c8a86b] font-bold">{formatCad(depositDueCents)}</strong> deposit secures this exclusive time slot and is deducted from the treatment price. You only pay the remaining{" "}
                      <strong className="text-[var(--ink)] font-semibold">{formatCad(remainingBalanceCents)}</strong> upon completion of your visit.
                    </>
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">⚠️</span>
                <span>
                  <strong className="text-amber-400 font-semibold">Strict No-Show Policy:</strong>{" "}
                  {isFullyCovered ? (
                    <>Because this private studio session is reserved exclusively for you, please notify us at least <strong className="text-[var(--ink)] font-bold">24 hours in advance</strong> if you need to reschedule your visit.</>
                  ) : (
                    <>Because this private studio session is reserved exclusively for you and prevents other clients from booking, the reservation deposit is <strong className="text-rose-400 font-bold">100% non-refundable</strong> if you do not show up for your appointment.</>
                  )}
                </span>
              </li>
            </ul>
          </div>

          {/* Payment Method Selector */}
          {isFullyCovered ? (
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider font-bold text-[var(--ink-soft)]">
                Payment Method
              </label>
              <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-[var(--ink)]">Digital Gift Certificate Applied</p>
                      <span className="font-mono text-xs font-bold text-[#c8a86b] bg-black/30 px-2 py-0.5 rounded border border-[#c8a86b]/20">
                        {validatedCoupon?.code}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                      {formatCad(couponDiscountCents)} applied to procedure · $0.00 deposit required today.
                    </p>
                  </div>
                </div>
                {remainingGiftCardBalanceCents > 0 && (
                  <div className="text-xs text-[var(--ink-soft)] sm:text-right">
                    <span>Remaining certificate balance: </span>
                    <strong className="text-[#c8a86b] font-mono">{formatCad(remainingGiftCardBalanceCents)}</strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider font-bold text-[var(--ink-soft)]">
                Choose Payment Method for Deposit ({formatCad(depositDueCents)})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDepositMethod("stripe")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    depositMethod === "stripe"
                      ? "border-[#c8a86b] bg-[#c8a86b]/15 text-[var(--ink)] font-bold shadow-md ring-1 ring-[#c8a86b]"
                      : "border-[var(--border-color)] bg-[var(--background)] hover:border-[#c8a86b]/50 text-[var(--ink-soft)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-[var(--ink)]">Debit or Credit Card</p>
                    {depositMethod === "stripe" && <span className="text-[#c8a86b] font-bold text-xs">✓ Selected</span>}
                  </div>
                  <p className="text-[11px] text-[var(--ink-soft)] mt-1.5 leading-normal">
                    Instant reservation confirmation with Visa, Mastercard, Debit, or Apple Pay.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDepositMethod("etransfer")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    depositMethod === "etransfer"
                      ? "border-[#c8a86b] bg-[#c8a86b]/15 text-[var(--ink)] font-bold shadow-md ring-1 ring-[#c8a86b]"
                      : "border-[var(--border-color)] bg-[var(--background)] hover:border-[#c8a86b]/50 text-[var(--ink-soft)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-[var(--ink)]">Interac e-Transfer</p>
                    {depositMethod === "etransfer" && <span className="text-[#c8a86b] font-bold text-xs">✓ Selected</span>}
                  </div>
                  <p className="text-[11px] text-[var(--ink-soft)] mt-1.5 leading-normal">
                    Slot held for 2 hours while your deposit transfer to Edmonton studio is verified.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Checkout Action Strip */}
          <div className="pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-[var(--ink-soft)] text-center sm:text-left">
              🔒 Safe & encrypted checkout ·{" "}
              {isFullyCovered ? (
                <>Confirmed reservation · <strong className="text-emerald-400 font-bold">$0.00</strong> charged today.</>
              ) : (
                <>Only <strong className="text-[var(--ink)] font-bold">{formatCad(depositDueCents)}</strong> is charged today.</>
              )}
            </p>

            <button
              type="button"
              disabled={loading}
              onClick={createBooking}
              className="btn-primary text-xs !py-3.5 !px-8 disabled:opacity-40 cursor-pointer shadow-lg w-full sm:w-auto hover:brightness-105 active:scale-[0.98] transition-all"
            >
              {loading
                ? "Securing Slot..."
                : isFullyCovered
                ? "Confirm Appointment (Fully Covered) →"
                : `Pay Deposit & Confirm (${formatCad(depositDueCents)}) →`}
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

          {isClientLoggedIn ? (
            <div className="pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-[var(--ink-soft)]">
                This booking is linked to your client account.
              </span>
              <Link
                href="/portal"
                className="btn-primary text-xs !py-2.5 !px-5 inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>Go to Client Portal</span>
                <span>→</span>
              </Link>
            </div>
          ) : encourageAccount ? (
            <div className="pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={requestAccountOtp}
                className="text-xs text-[#c8a86b] hover:underline font-semibold"
              >
                Send login code to save this booking in your client portal →
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
