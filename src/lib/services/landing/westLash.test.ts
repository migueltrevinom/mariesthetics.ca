import assert from "node:assert/strict";
import { test } from "node:test";
import { getLandingContent } from "./content";
import { buildLashSummary, lashPriceTitle } from "./lashSummary";
import { hreflangAlternatesForLanding, resolveLandingBySlugParam } from "./resolve";
import { LEGACY_SERVICE_LANDING_REDIRECTS } from "./registry";
import { isWestLashService } from "./westLashMatch";
import { WEST_LASH_PRICE_LEAD } from "./westLashCopy";
import { siteUrl } from "@/lib/seo";

const BANNED = /cheapest|más barat|pinaka-mura|الأرخص|Gillespie|1211|lash lift|tinting|touch-?up/i;

test("west edmonton slug is its own page and canonical target", () => {
  assert.equal(LEGACY_SERVICE_LANDING_REDIRECTS["lash-extensions-west-edmonton"], undefined);
  const resolved = resolveLandingBySlugParam("lash-extensions-west-edmonton");
  assert.ok(resolved);
  assert.equal(resolved.definition.key, "lash-extensions-west");
  const langs = hreflangAlternatesForLanding(resolved.definition);
  const self = `${siteUrl}/services/lash-extensions-west-edmonton`;
  assert.equal(langs["en-CA"], self);
  assert.equal(langs["x-default"], self);
  assert.notEqual(langs.es, self);
  assert.match(langs.tl, /lashes-west-edmonton-tl/);
  assert.match(langs.pa, /lashes-west-edmonton-pa/);
  assert.match(langs.ar, /\/services\/%/);
});

test("west edmonton copy stays on live services and the lowest-priced wording", () => {
  for (const loc of ["en", "es", "tl", "pa", "ar"] as const) {
    const c = getLandingContent("lash-extensions-west", loc);
    const blob = [c.metaTitle, c.metaDescription, c.h1, ...c.intro, ...c.whatToExpect, ...c.aftercare, ...c.faqs.flatMap((f) => [f.q, f.a])].join("\n");
    assert.equal(BANNED.test(blob), false, `${loc}: ${blob.match(BANNED)?.[0]}`);
    assert.equal(/\$\d/.test(blob), false, loc);
    assert.ok(c.faqs.length >= 3, loc);
    assert.match(c.bookCta, /\S/);
  }
  const en = getLandingContent("lash-extensions-west", "en");
  assert.match(en.h1, /Lash Extensions West Edmonton/);
  assert.match([en.metaDescription, ...en.intro, ...en.faqs.map((f) => f.a)].join(" "), /one of the lowest-priced/i);
  assert.match(en.intro.join(" "), /Lewis Estates/);
  assert.match(en.intro.join(" "), /Callingwood/);
  assert.match(en.intro.join(" "), /Glastonbury/);
  assert.match(en.intro.join(" "), /The Hamptons/);
  assert.match(en.intro.join(" "), /address is shared at booking/i);
});

test("west page title prices come from the service rows passed in", () => {
  const summary = buildLashSummary([
    { _id: "h", name: "Hybrid Set", slug: "hybrid-set", category: "lashes", priceCents: 9000, depositCents: 2500, durationMin: 135 },
    { _id: "v", name: "Volume Set (2D-5D)", slug: "volume-set", category: "lashes", priceCents: 10000, depositCents: 2500, durationMin: 150 },
    { _id: "hf", name: "Hybrid Fill", slug: "fill-service", category: "lashes", priceCents: 4500, depositCents: 2500, durationMin: 60 },
  ]);
  assert.ok(summary);
  assert.deepEqual(summary.lines.map((line) => line.type), ["hybrid", "volume"]);
  const head = lashPriceTitle(summary, "en", "Mari Esthetics", WEST_LASH_PRICE_LEAD.en);
  assert.equal(head?.title, "Lash Extensions West Edmonton | Hybrid $90 · Volume $100");
});

test("west matcher keeps hybrid and volume and drops classic, lifts, and tints", () => {
  assert.equal(isWestLashService({ name: "Hybrid Set", slug: "hybrid-set", category: "lashes" }), true);
  assert.equal(isWestLashService({ name: "Hybrid Fill", slug: "fill-service", category: "lashes" }), true);
  assert.equal(isWestLashService({ name: "Volume Set (2D-5D)", slug: "volume-set", category: "lashes" }), true);
  assert.equal(isWestLashService({ name: "Volume Fill", slug: "", category: "lashes", _id: "6a6fe50561dda32cf4b924f6" }), true);
  assert.equal(isWestLashService({ name: "Classic Set", slug: "classic-set", category: "lashes" }), false);
  assert.equal(isWestLashService({ name: "Lash Lift", slug: "lash-lift", category: "lashes" }), false);
  assert.equal(isWestLashService({ name: "Lash Tint", slug: "lash-tint", category: "lashes" }), false);
  assert.equal(isWestLashService({ name: "Basic Facial", slug: "basic-facial", category: "facials" }), false);
});
