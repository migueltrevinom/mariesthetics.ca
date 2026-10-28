import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlots } from "@/lib/booking/availability";
import { expireStaleHolds } from "@/lib/booking/holds";

const querySchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().min(1),
});

export async function GET(req: Request) {
  try {
    await expireStaleHolds();
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.parse({
      serviceId: searchParams.get("serviceId"),
      date: searchParams.get("date"),
    });

    // Performance Optimization (Bolt):
    // Delegate service lookup to getAvailableSlots (which fetches via .lean()).
    // Eliminates redundant duplicate Service.findById DB lookup and un-lean document hydration per request.
    const { slots } = await getAvailableSlots(parsed.serviceId, parsed.date);
    return NextResponse.json({ slots });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    if (err instanceof Error && err.message === "Service not found") {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }
}
