import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveLandingBySlugParam } from "./resolve";
import { serviceLandingPath } from "./paths";

describe("service landing resolve", () => {
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
