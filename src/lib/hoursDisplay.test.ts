import { test } from "node:test";
import assert from "node:assert/strict";
import { formatHoursLines } from "./hoursDisplay";

const live = [
  { dayOfWeek: ["Monday", "Tuesday", "Wednesday"], opens: "08:00", closes: "20:00" },
  { dayOfWeek: ["Thursday", "Friday"], opens: "09:00", closes: "18:00" },
  { dayOfWeek: ["Saturday"], opens: "09:00", closes: "17:00" },
];

test("no schedule -> no lines (never invents hours)", () => {
  assert.deepEqual(formatHoursLines(undefined), []);
  assert.deepEqual(formatHoursLines([]), []);
});

test("groups days, formats times, lists closed days", () => {
  const lines = formatHoursLines(live, "en");
  assert.deepEqual(lines.map((l) => l.days), ["Mon – Wed", "Thu – Fri", "Sat", "Sun"]);
  assert.match(lines[0].time, /^8:00\s?a\.?m\.? – 8:00\s?p\.?m\.?$/i);
  assert.equal(lines[3].time, "Closed");
});

test("localizes", () => {
  const es = formatHoursLines(live, "es");
  assert.equal(es[es.length - 1].time, "Cerrado");
  assert.match(es[0].days.toLowerCase(), /lun/);
});

test("non-consecutive days are listed separately", () => {
  const lines = formatHoursLines([{ dayOfWeek: ["Monday", "Wednesday", "Thursday", "Friday"], opens: "10:00", closes: "16:00" }], "en");
  assert.equal(lines[0].days, "Mon, Wed – Fri");
  assert.equal(lines[1].days, "Tue, Sat – Sun");
});
