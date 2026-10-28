import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadServicesForLanding, primaryLandingImage } from "./queries";
import { SERVICE_LANDING_PAGES } from "./registry";

describe("landing queries", () => {
  it("returns preview services when DB fails and dev preview is enabled", async () => {
    process.env.SERVICE_LANDING_DEV_PREVIEW = "1";
    const lashLanding = SERVICE_LANDING_PAGES.find((p) => p.key === "lash-extensions");
    assert.ok(lashLanding);

    const services = await loadServicesForLanding(lashLanding);
    assert.ok(Array.isArray(services));
    assert.ok(services.length > 0);
    assert.equal(services[0].category, "lashes");
  });

  it("selects primary landing image correctly", () => {
    const mockServices = [
      {
        _id: "1",
        name: "Lash Extensions",
        description: "",
        slug: "lash-extensions",
        durationMin: 60,
        priceCents: 10000,
        depositCents: 2000,
        category: "lashes",
        photos: ["https://example.com/lash.jpg"],
      },
    ];

    const img = primaryLandingImage(mockServices, "lash-extensions");
    assert.equal(img, "https://example.com/lash.jpg");
  });

  it("falls back to default image path if photos are missing", () => {
    const mockServices = [
      {
        _id: "1",
        name: "Lash Extensions",
        description: "",
        slug: "lash-extensions",
        durationMin: 60,
        priceCents: 10000,
        depositCents: 2000,
        category: "lashes",
        photos: [],
      },
    ];

    const img = primaryLandingImage(mockServices, "lash-extensions");
    assert.equal(img, "/images/services/lash-extensions.jpg");
  });
});
