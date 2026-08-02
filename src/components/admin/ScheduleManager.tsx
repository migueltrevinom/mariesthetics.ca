"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { createEdmontonDate } from "@/lib/timezone";

export interface TimeShift {
  openTime: string;
  closeTime: string;
}

export interface WeeklyHour {
  dayOfWeek: number;
  isOpen: boolean;
  shifts: TimeShift[];
}

export interface DateOverride {
  date: string;
  isOpen: boolean;
  shifts?: TimeShift[];
  note?: string;
}

export interface BlackoutBlock {
  _id: string;
  start: string;
  end: string;
  reason?: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ScheduleManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [weeklyHours, setWeeklyHours] = useState<WeeklyHour[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [blackoutBlocks, setBlackoutBlocks] = useState<BlackoutBlock[]>([]);

  // New Override form state
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideIsOpen, setOverrideIsOpen] = useState(false);
  const [overrideShifts, setOverrideShifts] = useState<TimeShift[]>([
    { openTime: "09:00", closeTime: "18:00" },
  ]);
  const [overrideNote, setOverrideNote] = useState("");

  // New Blackout Block form state
  const [blockDate, setBlockDate] = useState("");
  const [blockStartTime, setBlockStartTime] = useState("12:00");
  const [blockEndTime, setBlockEndTime] = useState("15:00");
  const [blockReason, setBlockReason] = useState("Lunch / Personal Break");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/schedule");
      if (!res.ok) throw new Error("Failed to load schedule config");
      const data = await res.json();
      if (data.schedule) {
        // Normalize weekly hours so each day has shifts array
        const normalizedWeekly: WeeklyHour[] = (data.schedule.weeklyHours || []).map((w: any) => {
          let shifts: TimeShift[] = w.shifts || [];
          if (shifts.length === 0 && w.openTime && w.closeTime) {
            shifts = [{ openTime: w.openTime, closeTime: w.closeTime }];
          }
          if (shifts.length === 0) {
            shifts = [{ openTime: "09:00", closeTime: "18:00" }];
          }
          return {
            dayOfWeek: w.dayOfWeek,
            isOpen: w.isOpen,
            shifts,
          };
        });
        setWeeklyHours(normalizedWeekly);

        // Normalize date overrides
        const normalizedOverrides: DateOverride[] = (data.schedule.dateOverrides || []).map((o: any) => {
          let shifts: TimeShift[] = o.shifts || [];
          if (shifts.length === 0 && o.openTime && o.closeTime) {
            shifts = [{ openTime: o.openTime, closeTime: o.closeTime }];
          }
          return {
            date: o.date,
            isOpen: o.isOpen,
            shifts,
            note: o.note,
          };
        });
        setDateOverrides(normalizedOverrides);
      }
      if (data.blocks) {
        setBlackoutBlocks(data.blocks);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSaveWeekly = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyHours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save weekly schedule");
      setMessage("Weekly working hours & shift splits saved successfully!");
      void loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save weekly schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleAddShift = (dayIdx: number) => {
    const updated = [...weeklyHours];
    const currentShifts = updated[dayIdx].shifts || [];
    const lastShift = currentShifts[currentShifts.length - 1];
    let newOpen = "13:00";
    let newClose = "20:00";
    if (lastShift) {
      // Suggest next shift starting 1 hour after previous shift ends
      const [h, m] = lastShift.closeTime.split(":").map(Number);
      const nextH = Math.min(h + 1, 22);
      newOpen = `${String(nextH).padStart(2, "0")}:00`;
      newClose = `${String(Math.min(nextH + 5, 23)).padStart(2, "0")}:00`;
    }
    updated[dayIdx].shifts = [...currentShifts, { openTime: newOpen, closeTime: newClose }];
    setWeeklyHours(updated);
  };

  const handleRemoveShift = (dayIdx: number, shiftIdx: number) => {
    const updated = [...weeklyHours];
    updated[dayIdx].shifts = updated[dayIdx].shifts.filter((_, idx) => idx !== shiftIdx);
    setWeeklyHours(updated);
  };

  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideDate) {
      setError("Please select a date for the override.");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload: any = {
        date: overrideDate,
        isOpen: overrideIsOpen,
        note: overrideNote,
      };
      if (overrideIsOpen) {
        payload.shifts = overrideShifts;
      }
      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save date override");
      setMessage("Date override saved!");
      setOverrideDate("");
      setOverrideNote("");
      void loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save date override");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (dateStr: string) => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/schedule?date=${dateStr}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove date override");
      setMessage(`Removed override for ${dateStr}`);
      void loadData();
    } catch (err: any) {
      setError(err.message || "Failed to remove date override");
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate || !blockStartTime || !blockEndTime) {
      setError("Date, start time, and end time are required.");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const [yyyy, mm, dd] = blockDate.split("-").map(Number);
      const [sH, sM] = blockStartTime.split(":").map(Number);
      const [eH, eM] = blockEndTime.split(":").map(Number);

      const startIso = createEdmontonDate(yyyy, mm, dd, sH, sM).toISOString();
      const endIso = createEdmontonDate(yyyy, mm, dd, eH, eM).toISOString();

      const res = await fetch("/api/admin/schedule/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: startIso,
          end: endIso,
          reason: blockReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add blackout block");
      setMessage("Blackout block added!");
      setBlockDate("");
      void loadData();
    } catch (err: any) {
      setError(err.message || "Failed to add blackout block");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/schedule/blocks/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete blackout block");
      setMessage("Blackout block removed");
      void loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete blackout block");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-[var(--ink-soft)] animate-pulse">
        Loading calendar schedule settings...
      </div>
    );
  }

  return (
    <div className="space-y-10 text-left">
      {/* Banner messages */}
      {message && (
        <div className="border border-leaf/30 bg-leaf/10 px-4 py-3 rounded-xl text-xs text-leaf font-semibold">
          ✓ {message}
        </div>
      )}
      {error && (
        <div className="border border-blush/30 bg-blush/10 px-4 py-3 rounded-xl text-xs text-blush font-semibold">
          ✕ {error}
        </div>
      )}

      {/* ── SECTION 1: WEEKLY WORKING HOURS & LUNCH BREAK SHIFTS ── */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Weekly Schedule & Shift Splits
            </h2>
            <p className="text-xs text-[var(--ink-soft)] mt-1">
              Set working shifts and lunch breaks per day (e.g. 9:00 AM – 12:00 PM, then 1:00 PM – 8:00 PM).
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveWeekly}
            className="bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:from-[#e2c78c] hover:to-[#c8a86b] text-[#24180a] font-semibold text-xs py-2.5 px-5 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-40 shadow-sm shrink-0"
          >
            {saving ? "Saving..." : "Save Weekly Schedule"}
          </button>
        </div>

        <div className="space-y-4">
          {weeklyHours.map((setting, dayIdx) => (
            <div
              key={setting.dayOfWeek}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                setting.isOpen
                  ? "border-[var(--border-color)] bg-white/[0.01]"
                  : "border-white/5 opacity-50 bg-black/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...weeklyHours];
                      updated[dayIdx].isOpen = !updated[dayIdx].isOpen;
                      setWeeklyHours(updated);
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      setting.isOpen ? "bg-[#c8a86b]" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        setting.isOpen ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-sm font-semibold text-[var(--ink)]">
                    {DAY_NAMES[setting.dayOfWeek]}
                  </span>
                </div>

                {!setting.isOpen && (
                  <span className="text-xs text-blush font-semibold tracking-wider uppercase">
                    Day Off / Closed
                  </span>
                )}
              </div>

              {/* Working Shifts list for this day */}
              {setting.isOpen && (
                <div className="space-y-2.5 pt-2 border-t border-white/5">
                  {setting.shifts.map((shift, shiftIdx) => (
                    <div key={shiftIdx} className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-[10px] uppercase font-bold text-[#c8a86b] w-14">
                        Shift {shiftIdx + 1}:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--ink-soft)]">Start:</span>
                        <input
                          type="time"
                          value={shift.openTime}
                          onChange={(e) => {
                            const updated = [...weeklyHours];
                            updated[dayIdx].shifts[shiftIdx].openTime = e.target.value;
                            setWeeklyHours(updated);
                          }}
                          className="border border-[var(--border-color)] bg-[var(--background)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                        />
                      </div>
                      <span className="text-[var(--ink-soft)]">–</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--ink-soft)]">End:</span>
                        <input
                          type="time"
                          value={shift.closeTime}
                          onChange={(e) => {
                            const updated = [...weeklyHours];
                            updated[dayIdx].shifts[shiftIdx].closeTime = e.target.value;
                            setWeeklyHours(updated);
                          }}
                          className="border border-[var(--border-color)] bg-[var(--background)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                        />
                      </div>

                      {setting.shifts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveShift(dayIdx, shiftIdx)}
                          className="text-blush hover:underline text-xs ml-auto cursor-pointer"
                        >
                          ✕ Remove Shift
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddShift(dayIdx)}
                    className="text-[11px] text-[#c8a86b] hover:text-[#e2c78c] font-medium underline underline-offset-2 cursor-pointer pt-1 block"
                  >
                    + Add Shift / Lunch Break Split
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: BLACKOUT TIME BLOCKS (SPECIFIC SINGLE DATE BREAKS) ── */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm space-y-6">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Single-Date Blackout Blocks
          </h2>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Block out hours for a specific date (e.g. personal appointment, studio maintenance).
          </p>
        </div>

        {/* Add Block Form */}
        <form onSubmit={handleAddBlock} className="p-4 border border-[var(--border-color)] rounded-xl bg-white/[0.01] space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#c8a86b]">
            + Add Single-Date Blackout Block
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[var(--ink-soft)] mb-1">Date</label>
              <input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              />
            </div>
            <div>
              <label className="block text-[var(--ink-soft)] mb-1">Start Time</label>
              <input
                type="time"
                value={blockStartTime}
                onChange={(e) => setBlockStartTime(e.target.value)}
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              />
            </div>
            <div>
              <label className="block text-[var(--ink-soft)] mb-1">End Time</label>
              <input
                type="time"
                value={blockEndTime}
                onChange={(e) => setBlockEndTime(e.target.value)}
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              />
            </div>
            <div>
              <label className="block text-[var(--ink-soft)] mb-1">Reason / Note</label>
              <input
                type="text"
                placeholder="e.g. Studio Maintenance"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-white/10 hover:bg-white/20 text-[var(--ink)] border border-[var(--border-color)] font-medium text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
          >
            Add Blackout Block
          </button>
        </form>

        {/* Existing Blocks List */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Active Blackout Blocks ({blackoutBlocks.length})
          </p>
          {blackoutBlocks.length === 0 ? (
            <p className="text-xs text-[var(--ink-soft)] italic py-2">
              No blackout time blocks currently set.
            </p>
          ) : (
            <div className="grid gap-2">
              {blackoutBlocks.map((b) => {
                const startDate = new Date(b.start);
                const endDate = new Date(b.end);
                return (
                  <div
                    key={b._id}
                    className="flex items-center justify-between p-3 border border-[var(--border-color)] bg-blush/5 rounded-xl text-xs"
                  >
                    <div>
                      <span className="font-bold text-[var(--ink)]">
                        {format(startDate, "EEEE, MMM d, yyyy")}
                      </span>
                      <span className="text-blush ml-2 font-medium">
                        {format(startDate, "h:mm a")} – {format(endDate, "h:mm a")}
                      </span>
                      {b.reason && (
                        <span className="text-[var(--ink-soft)] ml-3 opacity-80">
                          ({b.reason})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(b._id)}
                      className="text-xs text-blush hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 3: SPECIFIC DATE OVERRIDES ── */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm space-y-6">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Specific Date Overrides
          </h2>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Override hours or mark full days off for specific calendar dates.
          </p>
        </div>

        {/* Add Override Form */}
        <form onSubmit={handleAddOverride} className="p-4 border border-[var(--border-color)] rounded-xl bg-white/[0.01] space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#c8a86b]">
            + Add Date Override Rule
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[var(--ink-soft)] mb-1">Target Date</label>
              <input
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              />
            </div>
            <div>
              <label className="block text-[var(--ink-soft)] mb-1">Day Status</label>
              <select
                value={overrideIsOpen ? "open" : "closed"}
                onChange={(e) => setOverrideIsOpen(e.target.value === "open")}
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              >
                <option value="closed" className="bg-[var(--background)]">Closed / Full Day Off</option>
                <option value="open" className="bg-[var(--background)]">Custom Working Shifts</option>
              </select>
            </div>
            {overrideIsOpen && (
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-[var(--ink-soft)] mb-1">Shifts for this date</label>
                {overrideShifts.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={s.openTime}
                      onChange={(e) => {
                        const updated = [...overrideShifts];
                        updated[idx].openTime = e.target.value;
                        setOverrideShifts(updated);
                      }}
                      className="border border-[var(--border-color)] bg-[var(--background)] px-2 py-1.5 rounded-lg text-xs text-[var(--ink)]"
                    />
                    <span>–</span>
                    <input
                      type="time"
                      value={s.closeTime}
                      onChange={(e) => {
                        const updated = [...overrideShifts];
                        updated[idx].closeTime = e.target.value;
                        setOverrideShifts(updated);
                      }}
                      className="border border-[var(--border-color)] bg-[var(--background)] px-2 py-1.5 rounded-lg text-xs text-[var(--ink)]"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-[var(--ink-soft)] mb-1">Note (optional)</label>
              <input
                type="text"
                placeholder="e.g. Special Holiday Hours"
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-white/10 hover:bg-white/20 text-[var(--ink)] border border-[var(--border-color)] font-medium text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
          >
            Save Date Override
          </button>
        </form>

        {/* Existing Overrides List */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Active Date Overrides ({dateOverrides.length})
          </p>
          {dateOverrides.length === 0 ? (
            <p className="text-xs text-[var(--ink-soft)] italic py-2">
              No date-specific overrides defined.
            </p>
          ) : (
            <div className="grid gap-2">
              {dateOverrides.map((o) => (
                <div
                  key={o.date}
                  className="flex items-center justify-between p-3 border border-[var(--border-color)] bg-white/[0.02] rounded-xl text-xs"
                >
                  <div>
                    <span className="font-bold text-[var(--ink)]">{o.date}</span>
                    <span className="ml-3 font-semibold text-leaf">
                      {o.isOpen
                        ? (o.shifts || []).map((s) => `${s.openTime}–${s.closeTime}`).join(", ")
                        : "Closed / Day Off"}
                    </span>
                    {o.note && (
                      <span className="text-[var(--ink-soft)] ml-3 opacity-80">
                        ({o.note})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteOverride(o.date)}
                    className="text-xs text-blush hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
