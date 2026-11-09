import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { contactPageSeo, giftCardsPageSeo } from "./seo/staticPages";
import { buildMetadata, business, hreflangForSinglePath, siteUrl, stripBrandSuffix } from "./seo";

test("strips a trailing brand so the template adds it once", () => {
  assert.equal(stripBrandSuffix("Lash Extensions in West Edmonton | Mari Esthetics"), "Lash Extensions in West Edmonton");
  assert.equal(stripBrandSuffix("Facial · Mari Esthetics"), "Facial");
  assert.equal(stripBrandSuffix("Mari Esthetics tips for winter"), "Mari Esthetics tips for winter");
  assert.equal(stripBrandSuffix(undefined), undefined);
});

const STREET = /Gillespie|1211/i;

for (const page of [contactPageSeo, giftCardsPageSeo]) {
  test(`${page.path} head is self-canonical and distinct from the homepage`, () => {
    const meta = buildMetadata({
      title: page.title,
      description: page.description,
      path: page.path,
      keywords: page.keywords,
      hreflangAlternates: hreflangForSinglePath(page.path),
    });
    const title = `${page.title} · ${business.name}`;
    const url = `${siteUrl}${page.path}`;

    assert.ok(title.length <= 60, `title is ${title.length} chars: ${title}`);
    assert.ok(page.description.length <= 160, `description is ${page.description.length} chars`);
    assert.doesNotMatch(page.description, STREET);
    assert.doesNotMatch(page.description, /\$\d/);
    assert.equal(meta.alternates?.canonical, url);
    assert.notEqual(meta.alternates?.canonical, siteUrl);
    assert.equal(meta.description, page.description);

    const og = meta.openGraph as { title?: string; description?: string; url?: string } | undefined;
    assert.equal(og?.title, title);
    assert.equal(og?.description, page.description);
    assert.equal(og?.url, url);

    const twitter = meta.twitter as { title?: string; description?: string } | undefined;
    assert.equal(twitter?.title, title);
    assert.equal(twitter?.description, page.description);

    const languages = meta.alternates?.languages ?? {};
    for (const lang of ["en-CA", "es", "tl", "pa", "ar", "x-default"] as const) {
      assert.equal(languages[lang], url);
    }
  });
}

test("root layout does not fall back to the homepage canonical or og:url", () => {
  const src = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(src, /canonical:\s*siteUrl/);
  assert.doesNotMatch(src, /url:\s*siteUrl/);
});
