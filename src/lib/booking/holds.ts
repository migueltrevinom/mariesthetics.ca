import { connectDb } from "@/lib/db/connect";
import { Booking } from "@/lib/db/models";

export async function expireStaleHolds() {
  await connectDb();
  const result = await Booking.updateMany(
    {
      status: "held",
      holdExpiresAt: { $lte: new Date() },
    },
    {
      $set: { status: "expired" },
    },
  );
  return { expired: result.modifiedCount };
}
