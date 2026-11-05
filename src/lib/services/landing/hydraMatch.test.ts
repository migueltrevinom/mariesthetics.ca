import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getLandingContent } from "./content";
import { HYDRA_FACIAL_PREFIX_REDIRECTS } from "./hydraRedirects";
import { HYDRA_FACIAL_ID, isHydraFacial } from "./hydraMatch";
import { previewServicesForLanding } from "./previewServices";
import { SERVICE_LANDING_PAGES } from "./registry";
import { hreflangAlternatesForLanding, landingDefinitionForService } from "./resolve";
import { serviceLandingPath } from "./paths";
import { business } from "@/lib/seo";

const live = {
  _id: HYDRA_FACIAL_ID,
  name: "Hydro Facial",
  slug: "",
  category: "facials",
  priceCents: 10000,
  depositCents: 2500,
  durationMin: 150,
};

describe("hydra facial identity", () => {
  it("matches the live menu row when the slug is empty", () => {
    assert.equal(isHydraFacial(live), true);
    assert.equal(isHydraFacial({ ...live, _id: "other" }), true);
    assert.equal(isHydraFacial({ name: "Hydra Facial", slug: "hydra-facial", category: "facials" }), true);
    assert.equal(isHydraFacial({ name: "HydraFacial", slug: "hydro-facial", category: "facials" }), true);
  });

  it("does not match other facials", () => {
    assert.equal(isHydraFacial({ name: "Basic Facial", slug: "", category: "facials" }), false);
    assert.equal(isHydraFacial({ name: "Anti-aging Facial", slug: "anti-aging-facial", category: "facials" }), false);
    assert.equal(isHydraFacial({ name: "Deep Cleansing Facial", slug: "deep-cleansing-facial", category: "facials" }), false);
    assert.equal(isHydraFacial({ name: "Hydro Facial", slug: "", category: "lashes" }), false);
  });

  it("sends the empty-slug menu row to the dedicated page, not the general facial page", () => {
    assert.equal(landingDefinitionForService(live)?.key, "hydra-facial");
    assert.equal(
      landingDefinitionForService({ name: "Hydra Facial", slug: "hydra-facial", category: "facials" })?.key,
      "hydra-facial"
    );
    assert.equal(
      landingDefinitionForService({ name: "Basic Facial", slug: "basic-facial", category: "facials" })?.key,
      "facial-west"
    );
    assert.equal(
      landingDefinitionForService({ name: "Anti-aging Facial", slug: "anti-aging-facial", category: "facials" })?.key,
      "anti-aging-facial"
    );
  });
});

describe("hydra facial locales", () => {
  it("lists Arabic in hreflang and keeps suffix slugs canonical", () => {
    const def = SERVICE_LANDING_PAGES.find((d) => d.key === "hydra-facial")!;
    const languages = hreflangAlternatesForLanding(def);
    assert.equal(languages["en-CA"], "https://mariesthetics.ca/services/hydra-facial-edmonton");
    assert.equal(languages.es, "https://mariesthetics.ca/services/hydra-facial-edmonton-es");
    assert.equal(languages.tl, "https://mariesthetics.ca/services/hydra-facial-edmonton-tl");
    assert.equal(languages.pa, "https://mariesthetics.ca/services/hydra-facial-edmonton-pa");
    assert.equal(languages.ar, `https://mariesthetics.ca${serviceLandingPath(def.slugs.ar)}`);
    assert.match(languages.ar, /%D9%87%D9%8A%D8%AF%D8%B1%D8%A7/);
    assert.equal(languages["x-default"], languages["en-CA"]);
  });

  it("redirects prefix locale URLs to those canonical paths", () => {
    const def = SERVICE_LANDING_PAGES.find((d) => d.key === "hydra-facial")!;
    const bySource = Object.fromEntries(HYDRA_FACIAL_PREFIX_REDIRECTS.map((r) => [r.source, r.destination]));
    assert.equal(bySource["/es/services/hydra-facial-edmonton"], serviceLandingPath(def.slugs.es));
    assert.equal(bySource["/tl/services/hydra-facial-edmonton"], serviceLandingPath(def.slugs.tl));
    assert.equal(bySource["/pa/services/hydra-facial-edmonton"], serviceLandingPath(def.slugs.pa));
    assert.equal(bySource["/ar/services/hydra-facial-edmonton"], serviceLandingPath(def.slugs.ar));
    for (const rule of HYDRA_FACIAL_PREFIX_REDIRECTS) assert.equal(rule.permanent, true);
  });
});

describe("hydra facial copy", () => {
  it("names Marinelle, says the address is shared at booking, and never prints the street", () => {
    for (const locale of ["en", "es", "tl", "pa", "ar"] as const) {
      const content = getLandingContent("hydra-facial", locale);
      const visible = JSON.stringify(content);
      assert.match(visible, /Marinelle Trevino|مارينيل تريفينو/);
      assert.match(visible, /booking|reservar|nag-book|ਬੁਕਿੰਗ|الحجز/i);
      assert.equal(visible.includes(business.streetAddress), false);
      assert.equal(visible.includes("Gillespie"), false);
      assert.equal(visible.includes("1211"), false);
      assert.equal(visible.includes("$100"), false);
      assert.equal(visible.includes("10000"), false);
    }
  });

  it("preview row matches the live menu so offline pages do not invent a price or length", () => {
    const def = SERVICE_LANDING_PAGES.find((d) => d.key === "hydra-facial")!;
    const [row] = previewServicesForLanding(def);
    assert.equal(isHydraFacial(row), true);
    assert.equal(row.name, "Hydro Facial");
    assert.equal(row.slug, "");
    assert.equal(row.priceCents, live.priceCents);
    assert.equal(row.depositCents, live.depositCents);
    assert.equal(row.durationMin, live.durationMin);
    assert.equal(row._id, HYDRA_FACIAL_ID);
  });
});
