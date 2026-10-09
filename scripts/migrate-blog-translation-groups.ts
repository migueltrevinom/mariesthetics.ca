/**
 * Backfill translationGroupId for legacy blog posts (one unique group per post).
 * Run once against each environment: npx tsx scripts/migrate-blog-translation-groups.ts
 */
import "dotenv/config";
import { connectDb } from "../src/lib/db/connect";
import { BlogPost } from "../src/lib/db/models";
import { nanoid } from "nanoid";

async function main() {
  await connectDb();
  const posts = await BlogPost.find({
    $or: [{ translationGroupId: { $exists: false } }, { translationGroupId: "" }],
  }).select("_id");

  let updated = 0;
  for (const post of posts) {
    await BlogPost.updateOne(
      { _id: post._id },
      { $set: { translationGroupId: nanoid(12) } }
    );
    updated += 1;
  }

  console.log(`Backfilled translationGroupId on ${updated} blog post(s).`);
  await BlogPost.syncIndexes();
  console.log("BlogPost indexes synced.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
