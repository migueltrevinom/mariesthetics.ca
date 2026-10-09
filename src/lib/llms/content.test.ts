import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatLlmsBlogSection } from "./content";

describe("formatLlmsBlogSection", () => {
  it("lists all language variants with encoded blog URLs", () => {
    const arSlug = "حواجب-بودرة-ادمونتون-الخريف";
    const enSlug = "powder-brows-edmonton-book-this-fall";
    const gid = "group-1";

    const body = formatLlmsBlogSection(
      [
        {
          slug: enSlug,
          language: "en",
          title: "Powder Brows",
          excerpt: "Book this fall",
          translationGroupId: gid,
        },
        {
          slug: arSlug,
          language: "ar",
          title: "حواجب البودرة",
          excerpt: "احجزي في الخريف",
          translationGroupId: gid,
        },
      ],
      false
    );

    assert.match(body, /## Blog articles/);
    assert.match(body, /\[en\].*powder-brows-edmonton-book-this-fall/);
    assert.match(body, /\[ar\].*%D8%/);
    assert.doesNotMatch(body, /No published articles yet/);
  });

  it("shows empty state when there are no rows", () => {
    const body = formatLlmsBlogSection([], false);
    assert.match(body, /No published articles yet/);
  });
});
