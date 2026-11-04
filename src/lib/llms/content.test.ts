import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatLlmsBlogSection, formatLlmsSummary } from "./content";

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
    assert.match(body, /English[\s\S]*\[Powder Brows\]\(.*powder-brows-edmonton-book-this-fall\): Book this fall/);
    assert.match(body, /Arabic[\s\S]*%D8%/);
    assert.doesNotMatch(body, /No published articles yet/);
  });

  it("short summary lists live prices and key pages without the full blog dump", () => {
    const decoy = "This decoy article title should stay out of llms.txt";
    const rows = Array.from({ length: 40 }, (_, i) => ({
      slug: `decoy-${i}`,
      language: "en",
      title: `${decoy} ${i}`,
      excerpt: "x".repeat(500),
      translationGroupId: `g-${i}`,
    }));
    rows.push({
      slug: "volume-lash-cost-edmonton-2026-full-set-fill-prices",
      language: "en",
      title: "Volume lash cost guide",
      excerpt: "A short hub summary.",
      translationGroupId: "cost",
    });
    const body = formatLlmsSummary(
      [{ _id: "svc1", name: "Hybrid Set", slug: "hybrid-set", category: "lashes", priceCents: 9000, depositCents: 2500, durationMin: 135 }],
      rows,
    );
    assert.match(body, /Marinelle Trevino/);
    assert.match(body, /West Edmonton/);
    assert.match(body, /\/book/);
    assert.match(body, /lash-extensions-west-edmonton/);
    assert.match(body, /volume-lashes-edmonton/);
    assert.match(body, /\/about\/marinelle/);
    assert.match(body, /Hybrid Set/);
    assert.match(body, /\$90/);
    assert.match(body, /Volume lash cost guide/);
    assert.match(body, /llms-full\.txt/);
    assert.doesNotMatch(body, /This decoy article title should stay out/);
    assert.doesNotMatch(body, /Gillespie|1211/);
    assert.ok(body.length < 40_000, `summary is ${body.length} chars`);
  });

  it("shows empty state when there are no rows", () => {
    const body = formatLlmsBlogSection([], false);
    assert.match(body, /No published articles yet/);
  });
});
