import { test } from "node:test";
import assert from "node:assert/strict";
import { computeHomePrices } from "./prices";

test("lash price uses full sets only", () => {
  const r = computeHomePrices([
    { slug: "classic-fill", name: "Classic Fill", category: "lashes", priceCents: 4500 },
    { slug: "lash-lift", name: "Lash Lift", category: "lashes", priceCents: 4000 },
    { slug: "classic-set", name: "Classic Set", category: "lashes", priceCents: 7000 },
    { slug: "hybrid-set", name: "Hybrid Set", category: "lashes", priceCents: 9000 },
    { slug: "basic-facial", name: "Basic Facial", category: "facials", priceCents: 5000 },
  ]);
  assert.equal(r.lashes, 7000);
  assert.equal(r.sources.lashes, "Classic Set");
  assert.equal(r.facials, 5000);
  assert.equal(r.powderBrows, undefined);
  assert.equal(r.lipBlush, undefined);
});
