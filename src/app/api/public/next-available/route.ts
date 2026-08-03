import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models/Service";
import { getAvailableSlots } from "@/lib/booking/availability";
import { getEdmontonDateParts, createEdmontonDate } from "@/lib/timezone";
import { addDays, format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDb();
    const service = await Service.findOne({ active: true }).sort({ sortOrder: 1 });
    if (!service) {
      return NextResponse.json({ success: false, error: "No active service available" }, { status: 404 });
    }

    const now = new Date();
    const todayParts = getEdmontonDateParts(now);

    let foundSlot: { date: string; time: string; formattedLabel: string } | null = null;

    // Scan the next 7 days for the soonest available slot
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDateObj = addDays(now, dayOffset);
      const targetParts = getEdmontonDateParts(targetDateObj);
      const dayIso = targetParts.isoDate;

      try {
        const { slots } = await getAvailableSlots(String(service._id), dayIso);

        // Filter out past slots for today
        const validSlots = slots.filter((slot) => {
          const slotStartTime = new Date(slot.start);
          return slotStartTime > now;
        });

        if (validSlots.length > 0) {
          const soonest = validSlots[0];
          const slotDate = new Date(soonest.start);

          // Human friendly label
          let dayName = "";
          if (dayOffset === 0) dayName = "Today";
          else if (dayOffset === 1) dayName = "Tomorrow";
          else dayName = format(slotDate, "EEE, MMM d");

          const timeFormatted = format(slotDate, "h:mm a");
          const time24 = format(slotDate, "HH:mm");

          foundSlot = {
            date: dayIso,
            time: time24,
            formattedLabel: `${dayName} at ${timeFormatted}`,
          };
          break;
        }
      } catch (err) {
        // Skip unavailable days
      }
    }

    if (!foundSlot) {
      return NextResponse.json({ success: false, message: "No open slots in next 7 days" });
    }

    return NextResponse.json({
      success: true,
      serviceId: String(service._id),
      serviceSlug: service.slug,
      ...foundSlot,
    });
  } catch (err: any) {
    console.error("[Next Available Slot GET Error]:", err);
    return NextResponse.json({ error: "Failed to fetch next available slot" }, { status: 500 });
  }
}
