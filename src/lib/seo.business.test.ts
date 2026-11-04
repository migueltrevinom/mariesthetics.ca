import assert from "node:assert/strict";
import { test } from "node:test";
import { business, businessProfiles, localBusinessJsonLd } from "./seo";

test("beauty salon schema names the studio, west edmonton, and Marinelle once", () => {
  const ld = localBusinessJsonLd() as {
    name: string;
    alternateName: string[];
    priceRange: string;
    geo: { latitude: number; longitude: number };
    areaServed: Array<{ name: string }>;
    sameAs: readonly string[];
    founder: { name: string; url: string; "@id": string };
    employee: { "@id": string };
  };
  assert.equal(ld.name, "Mari Esthetics");
  assert.equal(business.name, "Mari Esthetics");
  assert.deepEqual(ld.alternateName, ["Mari Esthetics Edmonton", "Mari Esthetics West Edmonton"]);
  assert.equal(ld.priceRange, "$$");
  assert.equal(ld.geo.latitude, business.geo.lat);
  assert.equal(ld.geo.longitude, business.geo.lng);
  const areas = (ld.areaServed as Array<{ name: string }>).map((area) => area.name);
  for (const name of ["West Edmonton", "Lewis Estates", "Callingwood", "Glastonbury", "The Hamptons"]) {
    assert.ok(areas.includes(name), name);
  }
  assert.deepEqual([...(ld.sameAs as readonly string[])], [...businessProfiles]);
  assert.deepEqual([...businessProfiles], ["https://www.instagram.com/mariestheticsyeg"]);
  const founder = ld.founder as { name: string; url: string; ["@id"]: string };
  assert.equal(founder.name, "Marinelle Trevino");
  assert.match(founder.url, /\/about\/marinelle$/);
  assert.match(founder["@id"], /\/about\/marinelle#person$/);
  assert.equal((ld.employee as { ["@id"]: string })["@id"], founder["@id"]);
  assert.equal("aggregateRating" in ld, false);
});

test("aggregate rating is added only when a real review count is passed", () => {
  const empty = localBusinessJsonLd({ ratingValue: 5, reviewCount: 0 });
  assert.equal("aggregateRating" in empty, false);
  const real = localBusinessJsonLd({ ratingValue: 4.8, reviewCount: 12 }) as {
    aggregateRating?: { reviewCount: number };
  };
  assert.equal(real.aggregateRating?.reviewCount, 12);
});
