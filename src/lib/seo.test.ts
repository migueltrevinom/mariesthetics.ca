import assert from "node:assert/strict";
import { test } from "node:test";
import { stripBrandSuffix } from "./seo";

test("strips a trailing brand so the template adds it once", () => {
  assert.equal(stripBrandSuffix("Lash Extensions in West Edmonton | Mari Esthetics"), "Lash Extensions in West Edmonton");
  assert.equal(stripBrandSuffix("Facial · Mari Esthetics"), "Facial");
  assert.equal(stripBrandSuffix("Mari Esthetics tips for winter"), "Mari Esthetics tips for winter");
  assert.equal(stripBrandSuffix(undefined), undefined);
});
