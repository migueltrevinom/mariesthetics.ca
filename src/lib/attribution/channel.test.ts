import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adClickNetwork, deriveChannel, heardAboutLabel, parseBlogLanding } from "@/lib/attribution/channel";
import { resolveBookingSource } from "@/lib/attribution/normalize";
import {
  buildVisitTouch,
  parseTouch,
  planAttributionWrite,
  serializeTouch,
} from "@/lib/attribution/touch";

describe("deriveChannel", () => {
  it("reads Google search from a google referrer", () => {
    assert.equal(deriveChannel({ referrerUrl: "https://www.google.com/search?q=facials+edmonton" }), "Google search");
    assert.equal(deriveChannel({ referrerHost: "www.google.ca" }), "Google search");
    assert.equal(deriveChannel({ utmSource: "google", utmMedium: "organic" }), "Google search");
  });

  it("reads Bing", () => {
    assert.equal(deriveChannel({ referrerUrl: "https://www.bing.com/search?q=lashes" }), "Bing");
    assert.equal(deriveChannel({ utmSource: "bing" }), "Bing");
  });

  it("groups DuckDuckGo, Brave, Yahoo, and Ecosia as other search", () => {
    assert.equal(deriveChannel({ referrerHost: "duckduckgo.com" }), "Other search");
    assert.equal(deriveChannel({ referrerHost: "search.brave.com" }), "Other search");
    assert.equal(deriveChannel({ referrerUrl: "https://ca.search.yahoo.com/search?p=brows" }), "Other search");
    assert.equal(deriveChannel({ referrerHost: "www.ecosia.org" }), "Other search");
  });

  it("does not treat the Brave or Yahoo homepages' mail host as search", () => {
    assert.equal(deriveChannel({ referrerHost: "brave.com" }), "Referral");
    assert.equal(deriveChannel({ referrerHost: "mail.yahoo.com" }), "Referral");
  });

  it("reads Google Maps and Business Profile ahead of a click id", () => {
    assert.equal(
      deriveChannel({ referrerUrl: "https://www.google.com/maps/place/Mari+Esthetics" }),
      "Google Maps",
    );
    assert.equal(deriveChannel({ referrerHost: "maps.google.com" }), "Google Maps");
    assert.equal(deriveChannel({ utmSource: "gbp", gclid: "abc123" }), "Google Maps");
  });

  it("reads Instagram, Facebook, and TikTok from the referrer or utm source", () => {
    assert.equal(deriveChannel({ referrerHost: "l.instagram.com" }), "Instagram");
    assert.equal(deriveChannel({ utmSource: "ig", utmMedium: "social" }), "Instagram");
    assert.equal(deriveChannel({ referrerHost: "m.facebook.com" }), "Facebook");
    assert.equal(deriveChannel({ utmSource: "facebook" }), "Facebook");
    assert.equal(deriveChannel({ referrerUrl: "https://www.tiktok.com/@mari" }), "TikTok");
    assert.equal(deriveChannel({ utmSource: "tiktok" }), "TikTok");
  });

  it("reads AI assistants, including Gemini rather than Google search", () => {
    assert.equal(deriveChannel({ referrerHost: "chatgpt.com" }), "AI assistant");
    assert.equal(deriveChannel({ referrerHost: "chat.openai.com" }), "AI assistant");
    assert.equal(deriveChannel({ referrerHost: "www.perplexity.ai" }), "AI assistant");
    assert.equal(deriveChannel({ referrerUrl: "https://gemini.google.com/app" }), "AI assistant");
    assert.equal(deriveChannel({ referrerHost: "copilot.microsoft.com" }), "AI assistant");
    assert.equal(deriveChannel({ referrerUrl: "https://www.bing.com/chat?q=facial" }), "AI assistant");
    assert.equal(deriveChannel({ utmSource: "copilot" }), "AI assistant");
  });

  it("reads paid ads from click ids or a paid medium", () => {
    assert.equal(deriveChannel({ gclid: "CjwKtest", referrerHost: "www.google.com" }), "Paid ads");
    assert.equal(deriveChannel({ fbclid: "IwAR123", referrerHost: "l.facebook.com" }), "Paid ads");
    assert.equal(deriveChannel({ msclkid: "ms123" }), "Paid ads");
    assert.equal(deriveChannel({ ttclid: "tt123" }), "Paid ads");
    assert.equal(deriveChannel({ utmSource: "google", utmMedium: "cpc" }), "Paid ads");
    assert.equal(deriveChannel({ utmMedium: "Paid" }), "Paid ads");
    assert.equal(deriveChannel({ referrerHost: "www.googleadservices.com" }), "Paid ads");
  });

  it("reads email and newsletter campaigns", () => {
    assert.equal(deriveChannel({ utmSource: "newsletter", utmMedium: "email" }), "Email");
    assert.equal(deriveChannel({ utmMedium: "newsletter" }), "Email");
    assert.equal(deriveChannel({ utmSource: "klaviyo" }), "Email");
  });

  it("reads another site as referral and an empty visit as direct", () => {
    assert.equal(deriveChannel({ referrerUrl: "https://example.com/roundup" }), "Referral");
    assert.equal(deriveChannel({}), "Direct");
  });

  it("ignores a self-referral from mariesthetics.ca", () => {
    assert.equal(
      deriveChannel({
        referrerUrl: "https://www.mariesthetics.ca/services",
        referrerHost: "www.mariesthetics.ca",
      }),
      "Direct",
    );
    assert.equal(
      deriveChannel({
        referrerHost: "mariesthetics.ca",
        utmSource: "instagram",
      }),
      "Instagram",
    );
  });
});

describe("parseBlogLanding", () => {
  it("keeps the slug and ignores the blog index", () => {
    assert.deepEqual(parseBlogLanding("/blog/glass-skin"), { isBlogPost: true, slug: "glass-skin" });
    assert.deepEqual(parseBlogLanding("/blog/glass-skin/"), { isBlogPost: true, slug: "glass-skin" });
    assert.deepEqual(parseBlogLanding("/blog"), { isBlogPost: false, slug: "" });
    assert.deepEqual(parseBlogLanding("/services/facials"), { isBlogPost: false, slug: "" });
  });

  it("decodes a non-latin slug", () => {
    const slug = "عناية-بالبشرة";
    assert.equal(parseBlogLanding(`/blog/${encodeURIComponent(slug)}`).slug, slug.normalize("NFKC").toLowerCase());
  });
});

describe("visit capture", () => {
  it("lets the first touch win and still records a later visit", () => {
    assert.deepEqual(
      planAttributionWrite({
        hasExistingFirstTouch: true,
        referrerHost: "www.google.com",
        hasCampaignSignal: false,
      }),
      { writeFirst: false, writeLast: true },
    );
  });

  it("skips a same-site hop that has no campaign", () => {
    assert.deepEqual(
      planAttributionWrite({
        hasExistingFirstTouch: false,
        referrerHost: "www.mariesthetics.ca",
        hasCampaignSignal: false,
        pageHost: "mariesthetics.ca",
      }),
      { writeFirst: false, writeLast: false },
    );
  });

  it("keeps campaign params on an internal referrer", () => {
    const touch = buildVisitTouch({
      pageUrl: "https://mariesthetics.ca/book?utm_source=instagram&utm_medium=social",
      referrer: "https://mariesthetics.ca/blog/glass-skin",
      now: "2026-11-02T20:00:00.000Z",
    });
    assert.equal(touch.referrerHost, "");
    assert.equal(touch.utmSource, "instagram");
    assert.equal(touch.channel, "Instagram");
    assert.equal(touch.landingPath, "/book");
  });

  it("stores a blog landing with its language and drops that language elsewhere", () => {
    const post = buildVisitTouch({
      pageUrl: "https://mariesthetics.ca/blog/glass-skin",
      referrer: "https://www.google.ca/search?q=glass+skin",
      blogLanguage: "es",
      now: "2026-11-02T20:00:00.000Z",
    });
    assert.equal(post.channel, "Google search");
    assert.equal(post.blogSlug, "glass-skin");
    assert.equal(post.blogLanguage, "es");
    assert.equal(post.referrerHost, "www.google.ca");

    const home = buildVisitTouch({
      pageUrl: "https://mariesthetics.ca/",
      referrer: "",
      blogLanguage: "es",
    });
    assert.equal(home.channel, "Direct");
    assert.equal(home.blogSlug, "");
    assert.equal(home.blogLanguage, "");
  });

  it("round-trips a touch through the cookie encoding", () => {
    const touch = buildVisitTouch({
      pageUrl: "https://mariesthetics.ca/book?utm_campaign=spring&gclid=CjwK",
      referrer: "https://www.google.com/search?q=mari",
      now: "2026-11-02T20:00:00.000Z",
    });
    const parsed = parseTouch(serializeTouch(touch));
    assert.ok(parsed);
    assert.equal(parsed!.channel, "Paid ads");
    assert.equal(parsed!.utmCampaign, "spring");
    assert.equal(parsed!.gclid, "CjwK");
    assert.equal(parsed!.landingPath, "/book");
    assert.equal(parsed!.referrerHost, "www.google.com");
  });
});

describe("resolveBookingSource", () => {
  it("uses the first touch for the channel the owner sees", () => {
    const source = resolveBookingSource({
      heardAbout: "friend_family",
      heardAboutDetail: "  Met at pickleball  ",
      firstTouch: {
        referrerHost: "www.google.com",
        referrerUrl: "https://www.google.com/search?q=facials",
        landingPath: "/blog/glass-skin",
        blogLanguage: "en",
        ts: "2026-10-01T12:00:00.000Z",
      },
      lastTouch: {
        referrerHost: "l.instagram.com",
        referrerUrl: "https://l.instagram.com/",
        landingPath: "/book",
        ts: "2026-11-02T20:00:00.000Z",
      },
    });
    assert.ok(source);
    assert.equal(source!.channel, "Google search");
    assert.equal(source!.heardAbout, "friend_family");
    assert.equal(source!.heardAboutDetail, "Met at pickleball");
    assert.equal(heardAboutLabel(source!.heardAbout), "Friend or family");
    assert.equal(source!.landingPath, "/blog/glass-skin");
    assert.equal(source!.blogSlug, "glass-skin");
    assert.equal(source!.blogLanguage, "en");
    assert.equal(source!.lastTouch?.channel, "Instagram");
  });

  it("falls back to the attribution cookies when the body has no touch", () => {
    const touch = buildVisitTouch({
      pageUrl: "https://mariesthetics.ca/?utm_medium=email&utm_source=newsletter",
      referrer: "",
      now: "2026-11-02T20:00:00.000Z",
    });
    const source = resolveBookingSource({ heardAbout: "" }, serializeTouch(touch), null);
    assert.equal(source?.channel, "Email");
    assert.equal(source?.utmSource, "newsletter");
  });

  it("keeps a self-reported answer when the visit could not be read", () => {
    const source = resolveBookingSource({ heardAbout: "pickleball", heardAboutDetail: "Tuesday league" });
    assert.equal(source?.channel, "");
    assert.equal(source?.heardAbout, "pickleball");
    assert.equal(source?.heardAboutDetail, "Tuesday league");
  });

  it("drops junk instead of failing the booking", () => {
    assert.equal(resolveBookingSource(null), null);
    assert.equal(resolveBookingSource("nope"), null);
    assert.equal(resolveBookingSource({ heardAbout: "billboard", firstTouch: { referrerHost: 12 } }), null);
    const cleaned = resolveBookingSource({ heardAbout: "not-a-real-option", firstTouch: { landingPath: "/book" } });
    assert.equal(cleaned?.heardAbout, "");
    assert.equal(cleaned?.channel, "Direct");
    assert.equal(cleaned?.landingPath, "/book");
  });

  it("names the ad network without requiring the raw click id in the summary", () => {
    assert.equal(adClickNetwork({ gclid: "x" }), "Google ad click");
    assert.equal(adClickNetwork({ fbclid: "x" }), "Meta ad click");
    const source = resolveBookingSource({
      firstTouch: { landingPath: "/", gclid: "CjwK", utmMedium: "cpc", utmSource: "google" },
    });
    assert.equal(source?.channel, "Paid ads");
    assert.equal(source?.adClick, "Google ad click");
  });
});
