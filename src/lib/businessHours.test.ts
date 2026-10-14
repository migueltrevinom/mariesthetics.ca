import { test } from "node:test";
import assert from "node:assert/strict";
import { weeklyHoursToSpec } from "./businessHours";

test("groups identical shifts, skips closed days, omits when empty", () => {
  assert.equal(weeklyHoursToSpec([]), undefined);
  assert.equal(weeklyHoursToSpec([{ dayOfWeek: 0, isOpen: false, shifts: [{ openTime: "09:00", closeTime: "18:00" }] }]), undefined);
  const spec = weeklyHoursToSpec([
    { dayOfWeek: 1, isOpen: true, shifts: [{ openTime: "09:00", closeTime: "12:00" }, { openTime: "13:00", closeTime: "20:00" }] },
    { dayOfWeek: 2, isOpen: true, shifts: [{ openTime: "09:00", closeTime: "12:00" }] },
    { dayOfWeek: 0, isOpen: false, shifts: [{ openTime: "09:00", closeTime: "12:00" }] },
  ]);
  assert.deepEqual(spec?.map((s) => [s.dayOfWeek, s.opens, s.closes]), [
    [["Monday", "Tuesday"], "09:00", "12:00"],
    [["Monday"], "13:00", "20:00"],
  ]);
});
