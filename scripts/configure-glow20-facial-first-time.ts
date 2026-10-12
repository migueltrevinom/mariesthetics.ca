/**
 * Idempotent: configure GLOW20 for facial services, first-time clients only.
 * Run: npx tsx scripts/configure-glow20-facial-first-time.ts
 */
import { connectDb } from "../src/lib/db/connect";
import { Coupon, Service } from "../src/lib/db/models";

const CODE = "GLOW20";

async function main() {
  await connectDb();

  const facialServices = await Service.find({
    active: true,
    category: { $in: ["facial", "facials", "Facial", "Facials"] },
  })
    .select("_id category name")
    .lean();

  const serviceIds = facialServices.map((s) => s._id);
  const categoryIds = Array.from(
    new Set(facialServices.map((s) => String(s.category || "facial").toLowerCase()))
  );

  let coupon = await Coupon.findOne({ code: CODE });
  if (!coupon) {
    coupon = await Coupon.create({
      code: CODE,
      type: "percent",
      value: 20,
      active: true,
      firstTimeClientsOnly: true,
      serviceIds,
      categoryIds: categoryIds.length ? categoryIds : ["facial"],
    });
    console.log(`Created coupon ${CODE}`);
  } else {
    coupon.firstTimeClientsOnly = true;
    coupon.serviceIds = serviceIds;
    coupon.categoryIds = categoryIds.length ? categoryIds : ["facial"];
    if (!coupon.active) coupon.active = true;
    await coupon.save();
    console.log(`Updated coupon ${CODE} (${serviceIds.length} services)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
