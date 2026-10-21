import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("getPublishedBlogPostBySlug with preview enabled", () => {
  it("resolves preview blog post by slug and populates translations", async () => {
    process.env.BLOG_DEV_PREVIEW = "1";
    const { getPublishedBlogPostBySlug } = await import("./queries");
    const post = await getPublishedBlogPostBySlug("aftercare-dermaplaning-facial");
    assert.ok(post);
    assert.equal(post!.slug, "aftercare-dermaplaning-facial");
    assert.ok(Array.isArray(post!.translations));
    assert.ok(post!.translations.length > 0);
  });

  it("returns null for non-existent blog post slug", async () => {
    process.env.BLOG_DEV_PREVIEW = "1";
    const { getPublishedBlogPostBySlug } = await import("./queries");
    const post = await getPublishedBlogPostBySlug("non-existent-blog-post-slug-12345");
    assert.equal(post, null);
  });
});
