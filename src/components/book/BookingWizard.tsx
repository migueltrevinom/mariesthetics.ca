"use client";

import { useEffect, useMemo, useState } from "react";
import { format, addDays } from "date-fns";
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
  const [depositMethod, setDepositMethod] = useState<"stripe" | "etransfer">(
    "stripe",
  );
  const [bookingId, setBookingId] = useState("");
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [encourageAccount, setEncourageAccount] = useState(false);

  const selectedService = useMemo(
    () => services.find((s) => s._id === serviceId),
    [services, serviceId],
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
    fetch(`/api/bookings/availability?serviceId=${serviceId}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        setSelectedStart("");
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
            "Booking created. Stripe deposit could not start — check STRIPE_SECRET_KEY, or switch to e-Transfer.",
          );
          setStep("pay");
        } else {
          setMessage(
            `Deposit PaymentIntent created (${formatCad(payData.amountCents)}). Client secret ready for Stripe Elements / Checkout integration.`,
          );
          setStep("done");
          setEncourageAccount(true);
        }
      } else {
        setMessage(
          "Your slot is held for 2 hours. Send Interac e-Transfer for the deposit, then submit proof below.",
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
        body: JSON.stringify({
          email,
          name,
          phone,
          purpose: "link_account",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(
        data.devCode
          ? `Account code sent (dev): ${data.devCode}. Verify on the client login page.`
          : "Check your email for a login code to save your booking history.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const dates = Array.from({ length: 14 }, (_, i) =>
    format(addDays(new Date(), i), "yyyy-MM-dd"),
  );

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="mb-10 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-ink-soft">
        {(["service", "slot", "details", "pay", "done"] as Step[]).map((s) => (
          <li
            key={s}
            className={step === s ? "text-leaf font-semibold" : undefined}
          >
            {s}
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
              className="flex w-full items-start justify-between border border-[var(--line)] bg-white/60 p-5 text-left transition hover:border-leaf"
            >
              <span>
                <span className="block font-[family-name:var(--font-display)] text-2xl">
                  {service.name}
                </span>
                <span className="mt-1 block text-sm text-ink-soft">
                  {service.durationMin} min · deposit{" "}
                  {formatCad(service.depositCents)}
                </span>
              </span>
              <span className="font-medium">{formatCad(service.priceCents)}</span>
            </button>
          ))}
        </div>
      )}

      {step === "slot" && selectedService && (
        <div>
          <button
            type="button"
            className="text-sm text-ink-soft hover:text-ink"
            onClick={() => setStep("service")}
          >
            ← Change service
          </button>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl">
            {selectedService.name}
          </h2>
          <label className="mt-6 block text-sm text-ink-soft">
            Date
            <select
              className="mt-2 w-full border border-[var(--line)] bg-white px-3 py-3"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {loading && <p className="col-span-full text-sm text-ink-soft">Loading…</p>}
            {!loading && slots.length === 0 && (
              <p className="col-span-full text-sm text-ink-soft">
                No open slots this day.
              </p>
            )}
            {slots.map((slot) => (
              <button
                key={slot.start}
                type="button"
                onClick={() => setSelectedStart(slot.start)}
                className={`border px-2 py-3 text-sm ${
                  selectedStart === slot.start
                    ? "border-leaf bg-leaf text-white"
                    : "border-[var(--line)] bg-white hover:border-leaf"
                }`}
              >
                {format(new Date(slot.start), "h:mm a")}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!selectedStart}
            className="btn-primary mt-8 disabled:opacity-40"
            onClick={() => setStep("details")}
          >
            Continue
          </button>
        </div>
      )}

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
            className="w-full border border-[var(--line)] bg-white px-3 py-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="w-full border border-[var(--line)] bg-white px-3 py-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Phone"
            className="w-full border border-[var(--line)] bg-white px-3 py-3"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            placeholder="Coupon code (optional)"
            className="w-full border border-[var(--line)] bg-white px-3 py-3"
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
            className="min-h-28 w-full border border-[var(--line)] bg-white px-3 py-3"
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

      {step === "done" && (
        <div className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">
            You’re set
          </h2>
          <p className="text-ink-soft">
            Booking ID: <span className="text-ink">{bookingId}</span>
          </p>
          {encourageAccount && (
            <div className="border border-[var(--line)] bg-white/70 p-5">
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
