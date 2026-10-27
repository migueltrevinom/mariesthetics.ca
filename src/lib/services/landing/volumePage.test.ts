import { test } from "node:test";
import assert from "node:assert/strict";
import { isVolumeFill, isVolumeSet, lashMenuRank, pickVolumePair } from "./volumeMatch";
import { volumeLashStudioSetRange } from "./volumeCompare";
import { buildVolumeFaqs, buildVolumeHead, volumeCompareLine, volumeServiceJsonLd } from "./volumePage";
import { VOLUME_COPY } from "./volumeCopy";
import { landingDefinitionForService } from "./resolve";
import { hreflangForSinglePath } from "@/lib/seo";

const set = {
  _id: "6a6fdccb61dda32cf4b924f1",
  name: "Volume Set (2D-5D)",
  slug: "volume-set",
  category: "lashes",
  description: "Lightweight multi-dimensional fans.",
  priceCents: 10000,
  depositCents: 2500,
  durationMin: 150,
};
const fill = {
  _id: "6a6fe50561dda32cf4b924f6",
  name: "Volume Fill",
  slug: "",
  category: "lashes",
  description: "Recommended every 2–3 weeks. New set past 4 weeks or under 40% remaining. Lash bath included.",
  priceCents: 7000,
  depositCents: 2500,
  durationMin: 90,
};

test("volume fill matches by name and id when the slug is empty or shared", () => {
  assert.equal(isVolumeFill(fill), true);
  assert.equal(isVolumeFill({ ...fill, _id: "other", slug: "" }), true);
  assert.equal(isVolumeFill({ name: "Volume Fill", slug: "fill-service", category: "lashes" }), true);
  assert.equal(isVolumeFill({ name: "Hybrid Fill", slug: "", category: "lashes", _id: "6a6fe23c61dda32cf4b924f2" }), false);
  assert.equal(isVolumeFill({ name: "Classic Fill", slug: "fill-service", category: "lashes" }), false);
  assert.equal(isVolumeSet(set), true);
  assert.equal(isVolumeSet({ name: "Mega Volume Set", slug: "mega-volume", category: "lashes" }), false);
  assert.equal(isVolumeSet({ name: "Hybrid Set", slug: "hybrid-set", category: "lashes" }), false);
  const pair = pickVolumePair([
    { name: "Hybrid Fill", slug: "", category: "lashes", priceCents: 6000 },
    fill,
    { name: "Classic Set", slug: "classic-set", category: "lashes", priceCents: 7000 },
    set,
  ]);
  assert.equal(pair.set?.name, "Volume Set (2D-5D)");
  assert.equal(pair.fill?.name, "Volume Fill");
  assert.deepEqual(
    [set, fill, { name: "Classic Set", slug: "classic-set", category: "lashes" }].map(lashMenuRank),
    [0, 1, 2]
  );
});

test("volume services point at the volume guide, other lashes stay on the combined page", () => {
  assert.equal(landingDefinitionForService({ category: "lashes", slug: "", name: "Volume Fill", _id: fill._id })?.key, "volume-lashes");
  assert.equal(landingDefinitionForService({ category: "lashes", slug: "volume-set", name: set.name })?.key, "volume-lashes");
  assert.equal(landingDefinitionForService({ category: "lashes", slug: "classic-set", name: "Classic Set" })?.key, "lash-extensions");
  assert.equal(landingDefinitionForService({ category: "lashes", slug: "", name: "Hybrid Fill" })?.key, "lash-extensions");
});

test("title, meta and FAQ read live set and fill prices", () => {
  const head = buildVolumeHead([set, fill], "en", "Mari Esthetics")!;
  assert.equal(head.title, "Volume Lashes Edmonton | Volume Set $100 · Fill $70");
  assert.match(head.description, /2D–5D volume lash extensions in West Edmonton/);
  assert.match(head.description, /Full set \$100, fill \$70, \$25 deposit/);
  assert.equal(head.withBrand, false);
  const faqs = buildVolumeFaqs([set, fill], "en", "https://mariesthetics.ca/blog/parka");
  assert.match(faqs.find((f) => f.q.includes("How much"))!.a, /\$100/);
  assert.match(faqs.find((f) => f.q.includes("How much"))!.a, /\$70/);
  assert.match(faqs.find((f) => f.q.includes("How long"))!.a, /150 minutes/);
  assert.match(faqs.find((f) => f.q.includes("How long"))!.a, /90 minutes/);
  assert.match(faqs.map((f) => f.a).join(" "), /Lash bath included/);
  assert.match(faqs.map((f) => f.a).join(" "), /\$25/);
  assert.equal(buildVolumeHead([{ ...set, priceCents: 0 }, { ...fill, priceCents: 0 }], "en", "Mari Esthetics"), null);
});

test("schema has one offer per row, duration, deposit, and no rating or street address", () => {
  const ld = volumeServiceJsonLd({
    name: "Volume Lash Extensions in West Edmonton",
    description: "Volume lashes",
    url: "https://mariesthetics.ca/services/volume-lashes-edmonton",
    services: [set, fill],
  });
  assert.equal(ld.serviceType, "Volume lash extensions");
  assert.equal(ld.offers.length, 2);
  const setOffer = ld.offers[0];
  const fillOffer = ld.offers[1];
  assert.ok(setOffer && fillOffer);
  assert.equal(setOffer.price, "100.00");
  assert.equal(setOffer.eligibleDuration, "PT150M");
  assert.equal(setOffer.priceSpecification?.price, "25.00");
  assert.equal(fillOffer.price, "70.00");
  assert.equal(fillOffer.eligibleDuration, "PT90M");
  assert.match(fillOffer.url, /serviceId=6a6fe50561dda32cf4b924f6/);
  assert.match(String(fillOffer.description), /Lash bath included/);
  const json = JSON.stringify(ld);
  assert.equal(json.includes("aggregateRating"), false);
  assert.equal(json.includes("Gillespie"), false);
  assert.equal(json.includes("streetAddress"), false);
  assert.match(json, /\/#business/);
  assert.match(json, /\/about\/marinelle#person/);
});

test("price comparison is computed from sourced lash studios and does not say cheapest", () => {
  const range = volumeLashStudioSetRange()!;
  assert.equal(range.min, 140);
  assert.equal(range.max, 225);
  assert.equal(range.checked, "2026-10-27");
  assert.equal(range.sources.some((s) => s.fullSetCad === 95), false);
  assert.ok(range.sources.every((s) => s.sourceUrl && s.checked));
  const line = volumeCompareLine("en", range)!;
  assert.match(line.sentence, /\$140 to \$225/);
  assert.match(line.sentence, /Oct 27, 2026/);
  assert.match(line.lowest, /one of the lowest-priced/);
  assert.equal(/cheapest/i.test(`${line.sentence} ${line.lowest}`), false);
  for (const copy of Object.values(VOLUME_COPY)) {
    assert.equal(/cheapest|más barat|pinaka-mura|الأرخص/i.test(copy.lowestLine), false);
  }
});

test("shared pages advertise hreflang for every language plus x-default", () => {
  const langs = hreflangForSinglePath("/services");
  assert.deepEqual(Object.keys(langs).sort(), ["ar", "en-CA", "es", "pa", "tl", "x-default"].sort());
  assert.ok(Object.values(langs).every((url) => url.endsWith("/services")));
  assert.match(hreflangForSinglePath("/")["en-CA"], /mariesthetics\.ca\/?$/);
  assert.match(hreflangForSinglePath("/")["x-default"], /mariesthetics\.ca\/?$/);
});
