import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveLandingBySlugParam } from "./resolve";
import { serviceLandingPath } from "./paths";

describe("service landing resolve", () => {
  it("resolves volume lashes in each language", () => {
    assert.equal(resolveLandingBySlugParam("volume-lashes-edmonton")!.locale, "en");
    assert.equal(resolveLandingBySlugParam("volume-lashes-edmonton")!.definition.key, "volume-lashes");
    assert.equal(resolveLandingBySlugParam("pestanas-de-volumen-edmonton")!.locale, "es");
    assert.equal(resolveLandingBySlugParam("volume-lashes-edmonton-tl")!.locale, "tl");
    assert.equal(resolveLandingBySlugParam("volume-lashes-edmonton-pa")!.locale, "pa");
    assert.equal(resolveLandingBySlugParam(encodeURIComponent("رموش-فوليوم-ادمونتون"))!.locale, "ar");
  });

  it("resolves English lash extensions slug", () => {
    const r = resolveLandingBySlugParam("lash-extensions-edmonton");
    assert.ok(r);
    assert.equal(r!.definition.key, "lash-extensions");
    assert.equal(r!.locale, "en");
  });

  it("resolves percent-encoded Arabic slug", () => {
    const ar = "حواجب-بودرة-ادمونتون";
    const encoded = encodeURIComponent(ar);
    const r = resolveLandingBySlugParam(encoded);
    assert.ok(r);
    assert.equal(r!.definition.key, "powder-brows");
    assert.equal(r!.locale, "ar");
  });

  it("builds encoded service paths for Arabic", () => {
    const path = serviceLandingPath("هيدرا-فيشيال-ادمونتون");
    assert.match(path, /^\/services\/%/);
  });
});

describe("service landing slugs", () => {
  it("never reuses a slug across languages or pages", async () => {
    const { SERVICE_LANDING_PAGES, LEGACY_SERVICE_LANDING_REDIRECTS } = await import("./registry");
    const seen = new Set<string>();
    for (const def of SERVICE_LANDING_PAGES) {
      for (const slug of Object.values(def.slugs)) {
        assert.ok(!seen.has(slug), `duplicate slug ${slug}`);
        assert.ok(!(slug in LEGACY_SERVICE_LANDING_REDIRECTS), `legacy slug still in use: ${slug}`);
        seen.add(slug);
      }
    }
  });
});
