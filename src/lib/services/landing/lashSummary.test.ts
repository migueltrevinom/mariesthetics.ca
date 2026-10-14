import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLashSummary, buildLashFaq } from "./lashSummary";

const r = (name: string, priceCents: number, durationMin = 120, depositCents = 2500, category = "lashes") => ({ _id: name, name, slug: name.toLowerCase().replace(/\W+/g, "-"), category, priceCents, depositCents, durationMin });

test("full sets only, fills paired by type, no data -> null", () => {
  assert.equal(buildLashSummary([r("Classic Fill", 4500)]), null);
  const s = buildLashSummary([r("Classic Set", 7000), r("Classic Fill", 4500), r("Hybrid Set", 9000), r("Volume Set (2D-5D)", 10000, 150), r("Volume Fill", 5500), r("Lash Lift", 3000), r("Basic Facial", 5000, 60, 1000, "facials")])!;
  assert.deepEqual(s.lines.map((l) => [l.type, l.set?.priceCents, l.fill?.priceCents]), [["classic", 7000, 4500], ["hybrid", 9000, undefined], ["volume", 10000, 5500]]);
  assert.equal(s.minSet?.name, "Classic Set");
  assert.equal(s.minFill?.priceCents, 4500);
  const faq = buildLashFaq(s, "en");
  assert.match(faq[0].a, /Classic \$70\.00, Hybrid \$90\.00, Volume \$100\.00/);
  assert.match(faq[2].a, /120–150 min/);
});
