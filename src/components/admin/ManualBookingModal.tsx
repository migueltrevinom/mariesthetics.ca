"use client";

import { useState } from "react";
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
  
  // Guest fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Booking fields
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || "");
  const [dateStr, setDateStr] = useState(defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [timeStr, setTimeStr] = useState(defaultDate ? format(defaultDate, "HH:mm") : "10:00");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"confirmed" | "held">("confirmed");
  const [depositMethod, setDepositMethod] = useState<"cash" | "etransfer" | "stripe">("cash");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create datetime in ISO format: YYYY-MM-DDTHH:mm:00Z
      const startDateTime = new Date(`${dateStr}T${timeStr}:00`);
      
      const payload: any = {
        serviceId: selectedServiceId,
        start: startDateTime.toISOString(),
        notes,
        status,
        depositMethod,
      };

      if (bookingType === "existing") {
        if (!selectedClientId) {
          throw new Error("Please select a client");
        }
        payload.clientId = selectedClientId;
      } else {
        if (!guestName || !guestEmail) {
          throw new Error("Guest name and email are required");
        }
        payload.guest = {
          name: guestName,
          email: guestEmail,
          phone: guestPhone,
        };
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-white/[0.08] bg-[#0c120e] p-6 rounded-2xl shadow-2xl text-left max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
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
            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                Select Client
              </label>
              <select
                className="w-full border border-[var(--border-color)] bg-black/40 px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="" disabled>-- Choose Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0c120e]">
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3 p-3 bg-white/[0.02] border border-[var(--border-color)] rounded-xl">
              <div>
                <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  placeholder="Guest Full Name"
                  className="w-full border border-[var(--border-color)] bg-black/40 px-3 py-2 rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  className="w-full border border-[var(--border-color)] bg-black/40 px-3 py-2 rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  placeholder="+1 555 5555"
                  className="w-full border border-[var(--border-color)] bg-black/40 px-3 py-2 rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Service Dropdown */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
              Service
            </label>
            <select
              className="w-full border border-[var(--border-color)] bg-black/40 px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0c120e]">
                  {s.name} ({s.durationMin} min - ${(s.priceCents / 100).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                Date
              </label>
              <input
                type="date"
                className="w-full border border-[var(--border-color)] bg-black/40 px-3 py-2 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                Time
              </label>
              <input
                type="time"
                className="w-full border border-[var(--border-color)] bg-black/40 px-3 py-2 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
              />
            </div>
          </div>

          {/* Status & Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                Status
              </label>
              <select
                className="w-full border border-[var(--border-color)] bg-black/40 px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="confirmed" className="bg-[#0c120e]">Confirmed</option>
                <option value="held" className="bg-[#0c120e]">Held (Draft)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                Deposit Method
              </label>
              <select
                className="w-full border border-[var(--border-color)] bg-black/40 px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                value={depositMethod}
                onChange={(e) => setDepositMethod(e.target.value as any)}
              >
                <option value="cash" className="bg-[#0c120e]">Cash</option>
                <option value="etransfer" className="bg-[#0c120e]">E-Transfer</option>
                <option value="stripe" className="bg-[#0c120e]">Stripe</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
              Notes (optional)
            </label>
            <textarea
              placeholder="Add details, walk-in comments, adjustments..."
              className="w-full border border-[var(--border-color)] bg-black/40 px-3 py-2 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] min-h-[60px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
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
