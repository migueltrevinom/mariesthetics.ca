import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";
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

    await connectDb();
    const service = await Service.findById(parsed.serviceId);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const { slots } = await getAvailableSlots(parsed.serviceId, parsed.date);
    return NextResponse.json({ slots });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }
}
