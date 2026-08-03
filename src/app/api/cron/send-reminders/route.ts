import { NextResponse } from "next/server";
import { runAppointmentRemindersJob } from "@/lib/scheduledJobs";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    const isSecretValid =
      secret === config.cronSecret ||
      bearerToken === config.cronSecret ||
      process.env.NODE_ENV === "development";

    if (!isSecretValid) {
      return NextResponse.json({ error: "Unauthorized cron execution request" }, { status: 401 });
    }

    const jobResult = await runAppointmentRemindersJob();
    return NextResponse.json({ success: true, ...jobResult });
  } catch (err: any) {
    console.error("[Cron Send Reminders Error]:", err);
    return NextResponse.json({ error: err.message || "Cron job execution failed" }, { status: 500 });
  }
}
