"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export interface ServiceOption {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  depositCents: number;
}

export interface ClientOption {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: Date;
  services: ServiceOption[];
  clients: ClientOption[];
}

// Generate half-hour time slots from 8am–9pm
function generateSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h <= 21; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 21) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const ALL_SLOTS = generateSlots();

function formatSlotLabel(slot: string) {
  const [h, m] = slot.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m === 0 ? "00" : m} ${ampm}`;
}

export function ManualBookingModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
  services,
  clients,
}: ManualBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [bookingType, setBookingType] = useState<"existing" | "guest">("existing");
  const [selectedClientId, setSelectedClientId] = useState("");

  const [localClients, setLocalClients] = useState<ClientOption[]>(clients);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // Guest fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Booking fields
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || "");
  const [dateStr, setDateStr] = useState(
    defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [timeStr, setTimeStr] = useState(
    defaultDate
      ? (() => {
          const h = defaultDate.getHours();
          // Only use hours 8–20; otherwise default to 09:00
          if (h >= 8 && h <= 20) return format(defaultDate, "HH:00");
          return "09:00";
        })()
      : "09:00"
  );
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"confirmed" | "held">("confirmed");
  const [depositMethod, setDepositMethod] = useState<"cash" | "etransfer" | "stripe">("cash");

  // Booked slots for the selected date
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Sync prop clients
  useEffect(() => {
    setLocalClients(clients);
  }, [clients]);

  // Sync defaultDate → form fields whenever the modal opens or defaultDate changes
  useEffect(() => {
    if (isOpen && defaultDate) {
      setDateStr(format(defaultDate, "yyyy-MM-dd"));
      const h = defaultDate.getHours();
      if (h >= 8 && h <= 20) {
        setTimeStr(format(defaultDate, "HH:00"));
      } else {
        setTimeStr("09:00");
      }
    }
  }, [isOpen, defaultDate]);

  // Reset all form state on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedClientId("");
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setNotes("");
      setError("");
      setBookedTimes(new Set());
    }
  }, [isOpen]);

  // Fetch booked slots whenever the selected date changes
  useEffect(() => {
    if (!isOpen || !dateStr) return;

    const fetchBooked = async () => {
      setLoadingSlots(true);
      try {
        const from = new Date(`${dateStr}T00:00:00`);
        const to = new Date(`${dateStr}T23:59:59`);
        const res = await fetch(
          `/api/bookings?scope=admin&start=${from.toISOString()}&end=${to.toISOString()}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const booked = new Set<string>();
        const BUFFER_MIN = 30;
        for (const b of data.bookings || []) {
          const start = new Date(b.start);
          const end = new Date(b.end);
          // Mark slots from appointment start through end + 30-min buffer
          const bufferedEnd = new Date(end.getTime() + BUFFER_MIN * 60 * 1000);
          const cursor = new Date(start);
          while (cursor < bufferedEnd) {
            booked.add(format(cursor, "HH:mm"));
            cursor.setMinutes(cursor.getMinutes() + 30);
          }
        }
        setBookedTimes(booked);
      } catch (e) {
        console.error("Failed to load booked slots", e);
      } finally {
        setLoadingSlots(false);
      }
    };

    void fetchBooked();
  }, [isOpen, dateStr]);

  // Auto-advance timeStr to next available slot when bookedTimes changes
  useEffect(() => {
    if (bookedTimes.size === 0) return;
    if (!bookedTimes.has(timeStr)) return;
    const next = ALL_SLOTS.find((s) => !bookedTimes.has(s));
    if (next) setTimeStr(next);
  }, [bookedTimes]);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setLocalClients(clients);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/clients?search=${encodeURIComponent(searchQuery)}&limit=20&page=1`
        );
        if (res.ok) {
          const data = await res.json();
          const formatted = (data.clients || []).map((c: any) => ({
            id: String(c._id),
            name: c.name,
            email: c.email,
            phone: c.phone || "",
          }));
          setLocalClients(formatted);
        }
      } catch (err) {
        console.error("Failed to search clients", err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, clients]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookedTimes.has(timeStr)) {
      setError("That time slot is already booked. Please choose a different time.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const startDateTime = new Date(`${dateStr}T${timeStr}:00`);

      const payload: any = {
        serviceId: selectedServiceId,
        start: startDateTime.toISOString(),
        notes,
        status,
        depositMethod,
      };

      if (bookingType === "existing") {
        if (!selectedClientId) throw new Error("Please select a client");
        payload.clientId = selectedClientId;
      } else {
        if (!guestName || !guestEmail) throw new Error("Guest name and email are required");
        payload.guest = { name: guestName, email: guestEmail, phone: guestPhone };
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Split slots into morning (8am–11:30) and afternoon (12pm–9pm)
  const morningSlots = ALL_SLOTS.filter((s) => parseInt(s) < 12);
  const afternoonSlots = ALL_SLOTS.filter((s) => parseInt(s) >= 12);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-[var(--border-color)] bg-[var(--background)] p-6 rounded-2xl shadow-2xl text-left max-h-[90vh] overflow-y-auto transition-colors duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Create Booking
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm cursor-pointer px-2 py-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 border border-[#e8a0a2]/20 bg-[#e8a0a2]/5 px-4 py-2.5 rounded-lg text-xs text-[#e8a0a2]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-[var(--ink)]">
          {/* Client Selection Type */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold mb-1.5">
              Client Association
            </label>
            <div className="flex bg-white/[0.03] border border-[var(--border-color)] p-1 rounded-xl w-full text-xs font-medium">
              <button
                type="button"
                onClick={() => setBookingType("existing")}
                className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all duration-200 ${
                  bookingType === "existing"
                    ? "bg-white/[0.06] text-[var(--ink)] border border-[var(--border-color)] font-semibold shadow-sm"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                Existing Client
              </button>
              <button
                type="button"
                onClick={() => setBookingType("guest")}
                className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all duration-200 ${
                  bookingType === "guest"
                    ? "bg-white/[0.06] text-[var(--ink)] border border-[var(--border-color)] font-semibold shadow-sm"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                New Guest
              </button>
            </div>
          </div>

          {/* Client select or Guest input */}
          {bookingType === "existing" ? (
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                  Search Client (Name, Email, or Phone)
                </label>
                <input
                  type="text"
                  placeholder="Type to search..."
                  className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                  Select Client
                </label>
                <select
                  className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="" disabled>
                    {searching ? "Searching..." : "-- Choose Client --"}
                  </option>
                  {localClients.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[var(--background)]">
                      {c.name} ({c.email}) {c.phone ? `· ${c.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3 bg-white/[0.02] border border-[var(--border-color)] rounded-xl">
              <div>
                <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="Guest Full Name"
                  className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  placeholder="+1 555 5555"
                  className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Service Dropdown */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Service</label>
            <select
              className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id} className="bg-[var(--background)]">
                  {s.name} ({s.durationMin} min - ${(s.priceCents / 100).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Date</label>
            <input
              type="date"
              className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>

          {/* Time Slot Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-[var(--ink-soft)]">Time</label>
              {loadingSlots ? (
                <span className="text-[10px] text-[var(--ink-soft)] animate-pulse">Loading availability…</span>
              ) : bookedTimes.size > 0 ? (
                <span className="text-[10px] text-[var(--ink-soft)]">
                  <span className="inline-block w-2 h-2 rounded-sm bg-blush/40 mr-1 align-middle" />
                  Already booked
                </span>
              ) : null}
            </div>

            {/* Morning row */}
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] mb-1.5">Morning</p>
              <div className="grid grid-cols-4 gap-1.5">
                {morningSlots.map((slot) => {
                  const booked = bookedTimes.has(slot);
                  const selected = timeStr === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={booked}
                      onClick={() => setTimeStr(slot)}
                      className={`py-1.5 px-1 text-[11px] rounded-lg border font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed
                        ${
                          booked
                            ? "bg-blush/5 border-blush/15 text-blush/40 line-through"
                            : selected
                            ? "bg-[#c8a86b] border-[#c8a86b] text-[#24180a] font-semibold shadow-sm"
                            : "border-[var(--border-color)] text-[var(--ink-soft)] hover:border-[#c8a86b] hover:text-[var(--ink)] bg-[var(--card-bg)]"
                        }`}
                    >
                      {formatSlotLabel(slot)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Afternoon row */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] mb-1.5">Afternoon / Evening</p>
              <div className="grid grid-cols-4 gap-1.5">
                {afternoonSlots.map((slot) => {
                  const booked = bookedTimes.has(slot);
                  const selected = timeStr === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={booked}
                      onClick={() => setTimeStr(slot)}
                      className={`py-1.5 px-1 text-[11px] rounded-lg border font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed
                        ${
                          booked
                            ? "bg-blush/5 border-blush/15 text-blush/40 line-through"
                            : selected
                            ? "bg-[#c8a86b] border-[#c8a86b] text-[#24180a] font-semibold shadow-sm"
                            : "border-[var(--border-color)] text-[var(--ink-soft)] hover:border-[#c8a86b] hover:text-[var(--ink)] bg-[var(--card-bg)]"
                        }`}
                    >
                      {formatSlotLabel(slot)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected time display */}
            <p className="mt-2 text-[11px] text-[var(--ink-soft)]">
              Selected:{" "}
              <span className="font-semibold text-[var(--ink)]">
                {formatSlotLabel(timeStr)} on {dateStr}
              </span>
            </p>
          </div>

          {/* Status & Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Status</label>
              <select
                className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="confirmed" className="bg-[var(--background)]">Confirmed</option>
                <option value="held" className="bg-[var(--background)]">Held (Draft)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Deposit Method</label>
              <select
                className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                value={depositMethod}
                onChange={(e) => setDepositMethod(e.target.value as any)}
              >
                <option value="cash" className="bg-[var(--background)]">Cash</option>
                <option value="etransfer" className="bg-[var(--background)]">E-Transfer</option>
                <option value="stripe" className="bg-[var(--background)]">Stripe</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Notes (optional)</label>
            <textarea
              placeholder="Add details, walk-in comments, adjustments..."
              className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] min-h-[60px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || bookedTimes.has(timeStr)}
              className="w-full bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:from-[#e2c78c] hover:to-[#c8a86b] text-[#24180a] font-semibold text-sm py-3 px-4 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center shadow-md hover:shadow-lg"
            >
              {loading ? "Creating..." : "Save Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
