import { NextResponse } from "next/server";
import { runAppointmentRemindersJob } from "@/lib/scheduledJobs";
import { cronAuthError } from "@/lib/auth/cron";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const denied = cronAuthError(req);
    if (denied) {
      return NextResponse.json({ error: denied.error }, { status: denied.status });
    }

    const jobResult = await runAppointmentRemindersJob();
    return NextResponse.json({ success: true, ...jobResult });
  } catch (err: any) {
    console.error("[Cron Send Reminders Error]:", err);
    return NextResponse.json({ error: err.message || "Cron job execution failed" }, { status: 500 });
  }
}
