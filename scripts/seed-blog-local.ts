/**
 * Seeds sample published blog posts for local dev / screenshot capture only.
 * Requires MONGODB_URI pointing at a non-production database.
 * Run: SEED_BLOG_LOCAL=1 npx tsx scripts/seed-blog-local.ts
 */
import "dotenv/config";
import { connectDb } from "../src/lib/db/connect";
import { BlogPost } from "../src/lib/db/models";

const SAMPLE_POSTS = [
  {
    title: "How to Care for Your Skin After a Dermaplaning Facial",
    slug: "aftercare-dermaplaning-facial",
    excerpt:
      "Gentle aftercare keeps your glow lasting longer after dermaplaning. Here is what Mari recommends for the first 48 hours.",
    content: `## Why aftercare matters

Dermaplaning removes dead skin and peach fuzz for an instantly smoother canvas. The trade-off is that your skin is more receptive — and more sensitive — for a short window afterward.

## The first 24 hours

Skip heavy makeup, retinoids, and harsh exfoliants. Use a gentle cleanser, hydrate generously, and apply SPF 30+ if you step outside.

## When to book your next visit

Most clients love repeating dermaplaning every 4–6 weeks. Book online when you are ready for your next glow ritual.`,
    coverImage: "/images/services/hydra-facial.jpg",
    language: "en",
    category: "Skin Care Tips",
    status: "published",
    publishedAt: new Date(),
    metaTitle: "Dermaplaning Aftercare Tips",
    metaDescription:
      "Post-dermaplaning skin care advice from Mari Esthetics in West Edmonton — what to avoid, what to use, and when to rebook.",
    promoConfig: {
      enabled: true,
      promoCode: "GLOW10",
      customPromoText: "Save on your next facial when you book this month.",
      ctaButtonText: "Book Treatment Now →",
      ctaUrl: "/book",
    },
  },
  {
    title: "Lash Lift Aftercare: Keep Your Curl for Weeks",
    slug: "lash-lift-aftercare-guide",
    excerpt:
      "A few simple habits protect your lash lift investment — from shower steam to sleep position.",
    content: `## Keep them dry at first

Avoid water, steam, and sweat on your lashes for the first 24 hours so the lift sets properly.

## Daily habits

Brush lashes gently upward each morning. Skip oil-based removers near the lash line — they can relax the curl over time.

## Ready for a refresh?

Most lifts look beautiful for 6–8 weeks. Reserve your spot online when you are due.`,
    coverImage: "/images/services/hybrid-set.jpg",
    language: "en",
    category: "Lashes",
    status: "published",
    publishedAt: new Date(Date.now() - 86400000 * 3),
    metaDescription: "Lash lift aftercare from Mari Esthetics — how to protect your curl in Edmonton.",
    promoConfig: {
      enabled: false,
      ctaUrl: "/book",
      ctaButtonText: "Book Lash Lift →",
    },
  },
  {
    title: "What to Expect at Your First Facial at Mari Esthetics",
    slug: "first-facial-what-to-expect",
    excerpt:
      "Nervous about your first visit? Here is how a private, one-on-one facial unfolds in our West Edmonton studio.",
    content: `## A calm, unhurried consultation

We start with your skin goals, sensitivities, and routine. Nothing is rushed — this is your time.

## Custom treatment

Your facial is tailored in real time: cleanse, exfoliate, extractions only if needed, massage, mask, and finishing products chosen for your skin.

## After you leave

You will leave with product tips and a simple home-care plan. When you are ready, book your follow-up online.`,
    coverImage: "/images/services/basic-facial.jpg",
    language: "en",
    category: "Studio",
    status: "published",
    publishedAt: new Date(Date.now() - 86400000 * 7),
    promoConfig: {
      enabled: false,
      ctaUrl: "/book",
    },
  },
];

async function main() {
  if (process.env.SEED_BLOG_LOCAL !== "1") {
    console.error("Set SEED_BLOG_LOCAL=1 to run this script (local dev only).");
    process.exit(1);
  }

  await connectDb();

  for (const post of SAMPLE_POSTS) {
    await BlogPost.findOneAndUpdate(
      { slug: post.slug },
      { $set: post },
      { upsert: true, new: true }
    );
    console.log(`Upserted blog post: ${post.slug}`);
  }

  console.log("Done. Sample blog posts are published.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
