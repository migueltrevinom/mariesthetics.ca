import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BLOG_CLEANUP_REDIRECTS } from "./cleanupRedirects";
import { blogPostPath } from "./slug";

const VOLUME_AR_FROM = "تعبئة-رموش-فوليوم-ادمونتون-scream-يوم-الموتى";
const VOLUME_AR_TO = "تعبئة-رموش-فوليوم-غرب-ادمونتون-صباحات-مظلمة-ايقاع-التعبئة";
const CLASSIC_AR_FROM = "تعبئة-رموش-كلاسيك-ادمونتون-قبل-الهالوين";
const CLASSIC_AR_TO = "تعبئة-رموش-كلاسيك-غرب-ادمونتون-تساقط-الخريف";

describe("blog cleanup redirects", () => {
  it("301s only the two expired event families, language to language", () => {
    const bySource = Object.fromEntries(BLOG_CLEANUP_REDIRECTS.map((r) => [r.source, r.destination]));
    assert.equal(BLOG_CLEANUP_REDIRECTS.length, 10);
    assert.equal(
      bySource["/blog/volume-lash-fill-edmonton-scream-dia-de-los-muertos"],
      "/blog/volume-lash-fill-west-edmonton-no-fall-back-dark-mornings-fill-rhythm"
    );
    assert.equal(
      bySource["/blog/relleno-pestanas-volumen-edmonton-scream-dia-de-muertos"],
      "/blog/relleno-pestanas-volumen-west-edmonton-mananas-oscuras-ritmo-de-relleno"
    );
    assert.equal(
      bySource["/blog/volume-lash-fill-edmonton-scream-dia-de-los-muertos-tl"],
      "/blog/volume-lash-fill-west-edmonton-madilim-na-umaga-fill-rhythm"
    );
    assert.equal(
      bySource["/blog/edmonton-volume-lash-fill-scream-dia-de-los-muertos"],
      "/blog/west-edmonton-volume-fill-hanerhiyan-savere-fill-rhythm"
    );
    assert.equal(bySource[blogPostPath(VOLUME_AR_FROM)], blogPostPath(VOLUME_AR_TO));
    assert.equal(
      bySource["/blog/classic-lash-fill-edmonton-before-halloween"],
      "/blog/classic-lash-fill-west-edmonton-fall-shed-november"
    );
    assert.equal(
      bySource["/blog/relleno-pestanas-clasicas-edmonton-antes-de-halloween"],
      "/blog/relleno-pestanas-clasicas-west-edmonton-caida-de-otono"
    );
    assert.equal(
      bySource["/blog/classic-lash-fill-edmonton-bago-mag-halloween"],
      "/blog/classic-lash-fill-west-edmonton-fall-shed-nobyembre"
    );
    assert.equal(
      bySource["/blog/edmonton-classic-lash-fill-halloween-ton-pehlan"],
      "/blog/west-edmonton-classic-lash-fill-patjhad-november"
    );
    assert.equal(bySource[blogPostPath(CLASSIC_AR_FROM)], blogPostPath(CLASSIC_AR_TO));
    for (const rule of BLOG_CLEANUP_REDIRECTS) assert.equal(rule.statusCode, 301);
  });

  it("does not redirect Christmas Market, cat-eye, or the volume cost post", () => {
    const blob = BLOG_CLEANUP_REDIRECTS.map((r) => `${r.source} ${r.destination}`).join("\n");
    assert.equal(blob.includes("christmas-market"), false);
    assert.equal(blob.includes("cat-eye"), false);
    assert.equal(blob.includes("volume-lash-cost"), false);
    assert.equal(blob.includes("soft-glam"), false);
  });
});
