/**
 * Production signals for mail and public URLs.
 *
 * ENV=development is not trusted. Production was misconfigured with
 * ENV=development and MAILGUN_DEV_EMAIL, which rerouted every customer
 * email to a developer inbox. NODE_ENV, Vercel production, and the real
 * site host are the signals that must win.
 */

const PRODUCTION_SITE_HOSTS = new Set(["mariesthetics.ca", "www.mariesthetics.ca"]);

export function hostnameFrom(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  try {
    if (trimmed.includes("://")) {
      return new URL(trimmed).hostname || null;
    }
  } catch {
    // Fall through and parse host[:port][/path] ourselves.
  }

  let host = trimmed.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").split("/")[0] ?? "";
  if (host.includes("@")) host = host.slice(host.lastIndexOf("@") + 1);
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    return end > 1 ? host.slice(1, end) : null;
  }
  host = host.replace(/:\d+$/, "");
  return host || null;
}

export function isProductionSiteHost(value: string | null | undefined): boolean {
  const host = hostnameFrom(value);
  if (!host) return false;
  return PRODUCTION_SITE_HOSTS.has(host) || host.endsWith(".mariesthetics.ca");
}

/**
 * True when this process must behave as the live site, even if ENV is wrong.
 * A passed host (request Host or x-forwarded-host) is included so a request
 * that actually arrived at mariesthetics.ca cannot be treated as local dev.
 */
export function isProductionRuntime(host?: string | null): boolean {
  if (process.env.NODE_ENV?.toLowerCase() === "production") return true;
  if (process.env.VERCEL_ENV?.toLowerCase() === "production") return true;
  if (isProductionSiteHost(host)) return true;
  if (isProductionSiteHost(process.env.VERCEL_URL)) return true;
  if (isProductionSiteHost(process.env.VERCEL_BRANCH_URL)) return true;
  return false;
}

/**
 * App env label. Production builds and Vercel production never fall through
 * to the "development" default, and an explicit ENV=development on those
 * runtimes is ignored.
 */
export function resolveAppEnv(): string {
  if (isProductionRuntime()) {
    const explicit = process.env.ENV?.trim();
    if (explicit && explicit.toLowerCase() !== "development") return explicit;
    return "production";
  }
  return process.env.ENV ?? process.env.NODE_ENV ?? "development";
}
