import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authorFor, DEFAULT_BLOG_AUTHOR, personJsonLd } from "@/lib/blog/authors";

describe("blog authors", () => {
  it("resolves canonical and legacy author names to the same profile", () => {
    const canonical = authorFor(DEFAULT_BLOG_AUTHOR);
    const legacy = authorFor("Marinelle Tala");
    assert.ok(canonical);
    assert.ok(legacy);
    assert.equal(canonical, legacy);
    assert.equal(canonical!.name, DEFAULT_BLOG_AUTHOR);
  });

  it("personJsonLd includes @id, url, and jobTitle", () => {
    const author = authorFor(DEFAULT_BLOG_AUTHOR)!;
    const ld = personJsonLd(author, "en");
    assert.match(String(ld["@id"]), /\/about\/marinelle#person$/);
    assert.match(String(ld.url), /\/about\/marinelle$/);
    assert.ok(ld.jobTitle);
  });
});
