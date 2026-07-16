"use client";

import { useEffect, useMemo, useState } from "react";
import { format, addDays, parseISO, isToday, isTomorrow } from "date-fns";
import { formatCad } from "@/lib/money";

type Service = {
  _id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  depositCents: number;
};

type Slot = { start: string; end: string };

type Step = "service" | "slot" | "details" | "pay" | "done";

function formatSlotTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m === 0 ? "00" : m} ${ampm}`;
}

function friendlyDate(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return `Today · ${format(d, "MMMM d")}`;
  if (isTomorrow(d)) return `Tomorrow · ${format(d, "MMMM d")}`;
  return format(d, "EEEE, MMMM d");
}

export function BookingWizard({ initialServiceId }: { initialServiceId?: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
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
          setMessage(
            "Booking created. Stripe deposit could not start — check STRIPE_SECRET_KEY, or switch to e-Transfer."
          );
          setStep("pay");
        } else {
          setMessage(
            `Deposit PaymentIntent created (${formatCad(payData.amountCents)}). Client secret ready for Stripe Elements / Checkout integration.`
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

  // Group slots into morning (before 12pm) and afternoon (12pm+)
  const morningSlots = slots.filter((s) => new Date(s.start).getHours() < 12);
  const afternoonSlots = slots.filter((s) => new Date(s.start).getHours() >= 12);

  const STEPS: Step[] = ["service", "slot", "details", "pay", "done"];
  const STEP_LABELS: Record<Step, string> = {
    service: "Service",
    slot: "Slot",
    details: "Details",
    pay: "Pay",
    done: "Done",
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step breadcrumb */}
      <ol className="mb-10 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-ink-soft">
        {STEPS.map((s) => (
          <li key={s} className={step === s ? "text-leaf font-semibold" : undefined}>
            {STEP_LABELS[s]}
          </li>
        ))}
      </ol>

      {error && (
        <p className="mb-6 border border-blush/40 bg-blush/10 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-6 border border-leaf/30 bg-leaf/5 px-4 py-3 text-sm text-ink">
          {message}
        </p>
      )}

      {/* ── SERVICE STEP ── */}
      {step === "service" && (
        <div className="space-y-3">
          {services.map((service) => (
            <button
              key={service._id}
              type="button"
              onClick={() => {
                setServiceId(service._id);
                setStep("slot");
              }}
              className="flex w-full items-start justify-between border border-[var(--line)] bg-[var(--card-bg)] text-[var(--ink)] p-5 text-left transition hover:border-leaf"
            >
              <span>
                <span className="block font-[family-name:var(--font-display)] text-2xl">
                  {service.name}
                </span>
                <span className="mt-1 block text-sm text-ink-soft">
                  {service.durationMin} min · deposit {formatCad(service.depositCents)}
                </span>
              </span>
              <span className="font-medium">{formatCad(service.priceCents)}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── SLOT STEP ── */}
      {step === "slot" && selectedService && (
        <div>
          <button
            type="button"
            className="text-sm text-ink-soft hover:text-ink"
            onClick={() => setStep("service")}
          >
            ← Change service
          </button>

          <div className="mt-4 flex items-baseline gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-3xl">
              {selectedService.name}
              <span className="text-[length:1rem] text-ink-soft">.</span>
            </h2>
            <span className="text-sm text-ink-soft">
              {selectedService.durationMin} min · +30 min buffer
            </span>
          </div>

          {/* Date picker — horizontal scroll strip */}
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wider text-ink-soft mb-3 font-semibold">
              Select date
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {dates.map((d) => {
                const isSelected = date === d;
                const dayDate = parseISO(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    className={`flex-shrink-0 flex flex-col items-center py-2.5 px-3.5 rounded-xl border text-center transition-all duration-150 cursor-pointer min-w-[56px]
                      ${
                        isSelected
                          ? "border-[var(--leaf)] bg-[var(--leaf)]/10 text-[var(--ink)]"
                          : "border-[var(--line)] bg-[var(--card-bg)] text-ink-soft hover:border-[var(--leaf)] hover:text-[var(--ink)]"
                      }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      {format(dayDate, "EEE")}
                    </span>
                    <span className={`text-lg font-bold mt-0.5 ${isSelected ? "text-[var(--leaf)]" : ""}`}>
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

          {/* Friendly date heading */}
          {date && (
            <p className="mt-5 text-sm font-medium text-ink-soft">
              {friendlyDate(date)}
            </p>
          )}

          {/* Slot grid */}
          <div className="mt-3">
            {loading && (
              <p className="text-sm text-ink-soft animate-pulse py-6 text-center">
                Checking availability…
              </p>
            )}

            {!loading && slots.length === 0 && (
              <div className="py-8 text-center border border-[var(--line)] rounded-xl bg-[var(--card-bg)]">
                <p className="text-ink-soft text-sm">No open slots on this day.</p>
                <p className="text-ink-soft text-xs mt-1 opacity-70">
                  Try another date — existing appointments may fill the schedule.
                </p>
              </div>
            )}

            {!loading && slots.length > 0 && (
              <div className="space-y-4">
                {morningSlots.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-ink-soft mb-2 font-semibold">
                      Morning
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {morningSlots.map((slot) => (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setSelectedStart(slot.start)}
                          className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all duration-150 cursor-pointer text-center
                            ${
                              selectedStart === slot.start
                                ? "border-leaf bg-leaf/20 text-[var(--ink)] font-semibold shadow-sm"
                                : "border-[var(--line)] bg-[var(--card-bg)] text-ink-soft hover:border-leaf hover:text-[var(--ink)]"
                            }`}
                        >
                          {formatSlotTime(slot.start)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {afternoonSlots.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-ink-soft mb-2 font-semibold">
                      Afternoon / Evening
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {afternoonSlots.map((slot) => (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setSelectedStart(slot.start)}
                          className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all duration-150 cursor-pointer text-center
                            ${
                              selectedStart === slot.start
                                ? "border-leaf bg-leaf/20 text-[var(--ink)] font-semibold shadow-sm"
                                : "border-[var(--line)] bg-[var(--card-bg)] text-ink-soft hover:border-leaf hover:text-[var(--ink)]"
                            }`}
                        >
                          {formatSlotTime(slot.start)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected slot confirmation strip */}
          {selectedStart && (
            <div className="mt-5 flex items-center gap-3 p-3 border border-leaf/30 bg-leaf/5 rounded-xl text-sm">
              <span className="text-leaf font-bold text-base">✓</span>
              <span className="text-ink">
                <span className="font-semibold">{formatSlotTime(selectedStart)}</span>
                <span className="text-ink-soft"> · {friendlyDate(date)} · {selectedService.durationMin} min</span>
              </span>
            </div>
          )}

          <button
            type="button"
            disabled={!selectedStart}
            className="btn-primary mt-6 disabled:opacity-40"
            onClick={() => setStep("details")}
          >
            Continue
          </button>
        </div>
      )}

      {/* ── DETAILS STEP ── */}
      {step === "details" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void createBooking();
          }}
        >
          <h2 className="font-[family-name:var(--font-display)] text-3xl">
            Your details
          </h2>
          <p className="text-sm text-ink-soft">
            Book as a guest now — you can create an account after to save history.
          </p>
          <input
            required
            placeholder="Full name"
            className="w-full border border-[var(--line)] bg-[var(--card-bg)] text-[var(--ink)] px-3 py-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="w-full border border-[var(--line)] bg-[var(--card-bg)] text-[var(--ink)] px-3 py-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Phone"
            className="w-full border border-[var(--line)] bg-[var(--card-bg)] text-[var(--ink)] px-3 py-3"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            placeholder="Coupon code (optional)"
            className="w-full border border-[var(--line)] bg-[var(--card-bg)] text-[var(--ink)] px-3 py-3"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <fieldset className="space-y-2 pt-2">
            <legend className="text-sm font-medium">Deposit method</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={depositMethod === "stripe"}
                onChange={() => setDepositMethod("stripe")}
              />
              Card via Stripe (slot locks immediately after payment)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={depositMethod === "etransfer"}
                onChange={() => setDepositMethod("etransfer")}
              />
              Interac e-Transfer (2-hour hold until proof confirmed)
            </label>
          </fieldset>
          {selectedService && (
            <p className="text-sm text-ink-soft">
              Deposit due: {formatCad(selectedService.depositCents)}
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Booking…" : "Confirm & continue"}
          </button>
        </form>
      )}

      {/* ── PAY STEP ── */}
      {step === "pay" && depositMethod === "etransfer" && (
        <div className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">
            Complete e-Transfer
          </h2>
          {holdExpiresAt && (
            <p className="text-sm text-ink-soft">
              Hold expires: {format(new Date(holdExpiresAt), "PPpp")}
            </p>
          )}
          <textarea
            className="min-h-28 w-full border border-[var(--line)] bg-[var(--card-bg)] text-[var(--ink)] px-3 py-3"
            placeholder="Interac reference / confirmation details"
            value={proofNote}
            onChange={(e) => setProofNote(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={loading || !proofNote}
            onClick={() => void submitProof()}
          >
            Submit proof
          </button>
        </div>
      )}

      {/* ── DONE STEP ── */}
      {step === "done" && (
        <div className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">
            You're set
          </h2>
          <p className="text-ink-soft">
            Booking ID: <span className="text-ink">{bookingId}</span>
          </p>
          {encourageAccount && (
            <div className="border border-[var(--line)] bg-[var(--card-bg)] p-5">
              <p className="font-medium">Save your booking history?</p>
              <p className="mt-1 text-sm text-ink-soft">
                Create a client account with an email code — no password needed.
              </p>
              <button
                type="button"
                className="btn-ghost mt-4"
                onClick={() => void requestAccountOtp()}
                disabled={loading}
              >
                Send me a login code
              </button>
            </div>
          )}
          <a href="/book/success" className="btn-primary inline-flex">
            Done
          </a>
        </div>
      )}
    </div>
  );
}
