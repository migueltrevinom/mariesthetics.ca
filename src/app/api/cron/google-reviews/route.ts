import { NextResponse } from "next/server";
import { cronAuthError } from "@/lib/auth/cron";
import { refreshGoogleReviews } from "@/lib/googleReviews";

export const dynamic = "force-dynamic";

/** Monthly refresh of Google rating/reviews. Trigger from Cloud Scheduler with Authorization: Bearer <CRON_SECRET>. */
async function handle(req: Request) {
  const denied = cronAuthError(req);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });
  try {
    const result = await refreshGoogleReviews();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[Cron Google Reviews Error]:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
