import { test } from "node:test";
import assert from "node:assert/strict";
import { applyLandingDurations, formatDurationRange } from "./durations";
import { getLandingContent } from "./content";
import { SERVICE_LANDING_PAGES } from "./registry";

const base = { metaTitle: "", metaDescription: "", eyebrow: "", h1: "", pricingHeading: "", relatedBlogHeading: "", locationLinkLabel: "", bookCta: "", allServicesLabel: "" };

test("formatDurationRange", () => {
  assert.equal(formatDurationRange([150], "en"), "150 minutes");
  assert.equal(formatDurationRange([120, 150, 135], "es"), "120–150 minutos");
  assert.equal(formatDurationRange([], "en"), "");
});

test("tokens come from live services; missing data drops the line", () => {
  const c = applyLandingDurations(
    { ...base, intro: ["{duration} for you"], whatToExpect: ["Sets run {setDuration}; fills run {fillDuration}", "keep"], aftercare: [], faqs: [] },
    [{ name: "Classic Set", durationMin: 120 }, { name: "Volume Set (2D-5D)", durationMin: 150 }, { name: "Hybrid Fill", durationMin: 60 }, { name: "Volume Fill", durationMin: 90 }],
    "en"
  );
  assert.equal(c.intro[0], "60–150 minutes for you");
  assert.equal(c.whatToExpect[0], "Sets run 120–150 minutes; fills run 60–90 minutes");
  const none = applyLandingDurations({ ...base, intro: [], whatToExpect: ["Fills {fillDuration}", "keep"], aftercare: [], faqs: [] }, [{ name: "Classic Set", durationMin: 120 }], "en");
  assert.deepEqual(none.whatToExpect, ["keep"]);
});

test("guide copy has no hardcoded appointment lengths or unoffered services", () => {
  const banned = /(\b\d+\s*(?:–\s*\d+(?:\.\d+)?\s*)?(minutes?|minutos?|minuto|hours?|horas?|oras|ਮਿੰਟ|ਘੰਟੇ|دقيقة|ساعة)|dermaplan|brow shaping|lash lift|tinting|touch-?up|retoque|ਟੱਚ-ਅੱਪ|lamination|laminado)/i;
  const services = /(dermaplan|brow shaping|lash lift|tinting|touch-?up|retoque|ਟੱਚ-ਅੱਪ|lamination|laminado|التعبئة بعد|تعبئة بعد)/i;
  for (const def of SERVICE_LANDING_PAGES) {
    for (const loc of ["en", "es", "tl", "pa", "ar"] as const) {
      const c = getLandingContent(def.key, loc);
      const all = [c.metaTitle, c.metaDescription, ...c.intro, ...c.whatToExpect, ...c.faqs.flatMap((f) => [f.q, f.a])];
      for (const s of all) assert.ok(!banned.test(s), `${def.key}/${loc}: ${s}`);
      for (const s of c.aftercare) assert.ok(!services.test(s), `${def.key}/${loc} aftercare: ${s}`);
    }
  }
});
