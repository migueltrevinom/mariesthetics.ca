import { config } from "@/lib/config";

/** Fail-closed cron auth: 503 if CRON_SECRET is unset, 401 unless the request carries it. */
export function cronAuthError(req: Request): { status: 401 | 503; error: string } | null {
  const expected = config.cronSecret;
  if (!expected) return { status: 503, error: "Cron secret not configured" };
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.substring(7) : null;
  const query = new URL(req.url).searchParams.get("secret");
  if (bearer === expected || query === expected) return null;
  return { status: 401, error: "Unauthorized" };
}
