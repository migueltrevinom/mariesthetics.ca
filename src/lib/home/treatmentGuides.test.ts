import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildTreatmentGuideCards,
  categoryTag,
  durationLabel,
  GUIDE_COPY,
  readMinutesFromHtml,
  shortPrice,
  type GuideServiceRow,
} from "./treatmentGuides";
import { SERVICE_LANDING_PAGES } from "@/lib/services/landing/registry";

const row = (r: Partial<GuideServiceRow> & Pick<GuideServiceRow, "name" | "slug" | "category" | "priceCents">): GuideServiceRow => ({
  _id: r.slug,
  depositCents: 2500,
  durationMin: 60,
  photos: [],
  ...r,
});

const ROWS: GuideServiceRow[] = [
  row({ name: "Classic Set", slug: "classic-set", category: "lashes", priceCents: 7000, durationMin: 120, photos: ["https://cdn.verifik.co/mariesthetics/services/classic-set.jpg"] }),
  row({ name: "Volume Set (2D-5D)", slug: "volume-set", category: "lashes", priceCents: 10000, durationMin: 150 }),
  row({ name: "Volume Fill", slug: "", category: "lashes", priceCents: 7000, durationMin: 90 }),
  row({ name: "Classic Fill", slug: "classic-fill", category: "lashes", priceCents: 4500, durationMin: 60 }),
  row({ name: "Basic Facial", slug: "basic-facial", category: "facials", priceCents: 5000, durationMin: 50 }),
  row({ name: "Hydra Facial", slug: "hydra-facial", category: "facials", priceCents: 10000, durationMin: 75, photos: ["https://cdn.verifik.co/mariesthetics/services/hydra-facial.jpg"] }),
  row({ name: "Lip Blush", slug: "lip-blush", category: "permanentMakeUp", priceCents: 25000, durationMin: 150 }),
];

test("one card per landing guide, in registry order", () => {
  const cards = buildTreatmentGuideCards(ROWS);
  assert.deepEqual(cards.map((c) => c.key), SERVICE_LANDING_PAGES.map((d) => d.key));
});

test("volume guide from-price is the set, not the empty-slug fill", () => {
  const volume = buildTreatmentGuideCards(ROWS).find((c) => c.key === "volume-lashes")!;
  assert.equal(volume.fromCents, 10000);
  assert.equal(volume.group, "lashes");
});

test("lash 'from' price ignores fills and uses full sets only", () => {
  const lash = buildTreatmentGuideCards(ROWS).find((c) => c.key === "lash-extensions")!;
  assert.equal(lash.fromCents, 7000);
  assert.equal(lash.minDur, 120);
  assert.equal(lash.maxDur, 150);
  assert.equal(lash.image, "https://cdn.verifik.co/mariesthetics/services/classic-set.jpg");
  assert.equal(lash.group, "lashes");
});

test("facials guide uses the cheapest facial; dedicated guides use their own service", () => {
  const cards = buildTreatmentGuideCards(ROWS);
  assert.equal(cards.find((c) => c.key === "facial-west")!.fromCents, 5000);
  const hydra = cards.find((c) => c.key === "hydra-facial")!;
  assert.equal(hydra.fromCents, 10000);
  assert.equal(hydra.image, "https://cdn.verifik.co/mariesthetics/services/hydra-facial.jpg");
});

test("services missing from the DB get no price, duration or image (nothing invented)", () => {
  const brows = buildTreatmentGuideCards(ROWS).find((c) => c.key === "powder-brows")!;
  assert.equal(brows.fromCents, undefined);
  assert.equal(brows.minDur, undefined);
  assert.equal(brows.image, undefined);
  assert.equal(buildTreatmentGuideCards([]).every((c) => c.fromCents === undefined), true);
});

test("formatting helpers", () => {
  assert.equal(shortPrice(7000), "$70");
  assert.equal(shortPrice(7250), "$72.50");
  assert.equal(durationLabel({ minDur: 50, maxDur: 90 }, "min"), "50–90 min");
  assert.equal(durationLabel({ minDur: 60, maxDur: 60 }, "min"), "60 min");
  assert.equal(durationLabel({}, "min"), undefined);
  assert.equal(readMinutesFromHtml(`<p>${"word ".repeat(1000)}</p>`), 5);
  assert.equal(readMinutesFromHtml("<p>short</p>"), 1);
});

test("all locales have every label and benefit line", () => {
  for (const [loc, c] of Object.entries(GUIDE_COPY)) {
    for (const d of SERVICE_LANDING_PAGES) assert.ok(c.benefit[d.key], `${loc} ${d.key}`);
    assert.ok(c.viewAll && c.viewGuide && c.subtitle && c.groups.browsLips, loc);
  }
  assert.equal(categoryTag("lashes", "es"), "Pestañas");
  assert.equal(categoryTag("permanentMakeUp", "en"), "Brows & Lips");
  assert.equal(categoryTag("unknown", "en"), undefined);
});
