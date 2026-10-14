import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { refreshGoogleReviews } from "@/lib/googleReviews";

export const dynamic = "force-dynamic";

/** Monthly refresh of Google rating/reviews. Trigger from Cloud Scheduler with Authorization: Bearer <CRON_SECRET>. */
async function handle(req: Request) {
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.substring(7) : null;
  const secret = new URL(req.url).searchParams.get("secret");
  if (bearer !== config.cronSecret && secret !== config.cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
