import { isProductionRuntime } from "@/lib/runtimeEnv";

export interface OutboundEmailRoute {
  to: string;
  subject: string;
  redirected: boolean;
}

function isNextBailout(err: unknown): boolean {
  if (!err || typeof err !== "object" || !("digest" in err)) return false;
  const digest = String((err as { digest?: unknown }).digest);
  return digest.startsWith("NEXT_") || digest.includes("DYNAMIC_SERVER_USAGE") || digest.includes("BAILOUT");
}

/**
 * Host of the current Next.js request, if one exists.
 * Cron jobs and unit tests have no request store; that must not fail the send.
 * Next.js render bailouts are rethrown so a page is not pinned to the wrong host.
 */
export async function readIncomingRequestHost(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const incoming = await headers();
    const raw = incoming.get("x-forwarded-host") || incoming.get("host");
    return raw?.split(",")[0]?.trim() || null;
  } catch (err) {
    if (isNextBailout(err)) throw err;
    return null;
  }
}

/**
 * Dev inbox redirect (MAILGUN_DEV_EMAIL).
 *
 * Allowed only when this is not a production runtime: NODE_ENV is not
 * production, Vercel is not serving production, and the request or site
 * host is not mariesthetics.ca. Local `next dev` still redirects.
 */
export function routeOutboundEmail(
  to: string,
  subject: string,
  host?: string | null,
): OutboundEmailRoute {
  const devEmail = (process.env.MAILGUN_DEV_EMAIL ?? "").trim();
  if (!devEmail) {
    return { to, subject, redirected: false };
  }

  const nodeEnv = process.env.NODE_ENV ?? "unset";
  const vercelEnv = process.env.VERCEL_ENV ?? "unset";
  const appEnv = process.env.ENV ?? "unset";

  if (isProductionRuntime(host)) {
    console.warn(
      `[email] Dev mailbox redirect is disabled on this production runtime ` +
        `(NODE_ENV=${nodeEnv}, VERCEL_ENV=${vercelEnv}, ENV=${appEnv}, host=${host || "none"}). ` +
        `MAILGUN_DEV_EMAIL=${devEmail} will not receive mail for "${to}". Sending to the original recipient.`,
    );
    return { to, subject, redirected: false };
  }

  console.warn(
    `[email] DEV REDIRECT ACTIVE: mail for "${to}" will be sent to "${devEmail}" ` +
      `with subject prefix "[DEV: originally to ${to}]". ` +
      `Allowed only because this is not production (NODE_ENV=${nodeEnv}, VERCEL_ENV=${vercelEnv}, ENV=${appEnv}, host=${host || "none"}).`,
  );

  return {
    to: devEmail,
    subject: `[DEV: originally to ${to}] ${subject}`,
    redirected: true,
  };
}

/** Same guard as routeOutboundEmail, using the live request host when the caller has none. */
export async function resolveOutboundEmail(
  to: string,
  subject: string,
  host?: string | null,
): Promise<OutboundEmailRoute> {
  const explicit = host?.trim();
  const resolvedHost = explicit || (await readIncomingRequestHost());
  return routeOutboundEmail(to, subject, resolvedHost);
}
