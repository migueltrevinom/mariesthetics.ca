import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  blogPostPath,
  decodeBlogSlugParam,
  encodeBlogSlugPathSegment,
  normalizeBlogSlugForLookup,
} from "./slug";

const AR_POWDER = "حواجب-بودرة-ادمونتون-الخريف";
const AR_LASH = "وصلات-رموش-ادمونتون-الشتاء-الاعياد";

describe("blog slug helpers", () => {
  it("decodes percent-encoded Arabic params", () => {
    const encoded = encodeURIComponent(AR_POWDER);
    assert.equal(decodeBlogSlugParam(encoded), AR_POWDER);
    assert.equal(normalizeBlogSlugForLookup(encoded), AR_POWDER);
  });

  it("leaves decoded Arabic unchanged", () => {
    assert.equal(normalizeBlogSlugForLookup(AR_LASH), AR_LASH);
  });

  it("normalizes Latin slugs to lowercase", () => {
    assert.equal(
      normalizeBlogSlugForLookup("Powder-Brows-Edmonton"),
      "powder-brows-edmonton"
    );
  });

  it("builds encoded blog paths for Arabic", () => {
    const path = blogPostPath(AR_POWDER);
    assert.match(path, /^\/blog\/%/);
    assert.equal(decodeBlogSlugParam(path.replace("/blog/", "")), AR_POWDER);
  });

  it("round-trips encode segment helper", () => {
    const segment = encodeBlogSlugPathSegment(AR_LASH);
    assert.equal(decodeBlogSlugParam(segment), AR_LASH);
  });
});
