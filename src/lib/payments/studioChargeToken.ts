import { SignJWT, jwtVerify } from "jose";

const AUDIENCE = "studio_charge";
const ISSUER = "mariesthetics.ca";
export const STUDIO_CHARGE_TOKEN_TTL = "7d";

/**
 * Secret for pay-link JWTs. Prefers STUDIO_CHARGE_JWT_SECRET and falls back to
 * JWT_SECRET. Tokens carry a dedicated audience so they can never be confused
 * with login session tokens (and vice versa).
 */
function secretKey(): Uint8Array {
  const secret = process.env.STUDIO_CHARGE_JWT_SECRET || process.env.JWT_SECRET || "";
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("STUDIO_CHARGE_JWT_SECRET is not configured");
    }
    return new TextEncoder().encode("dev-insecure-studio-charge-secret");
  }
  return new TextEncoder().encode(secret);
}

export async function signStudioChargeToken(chargeId: string): Promise<string> {
  return new SignJWT({ cid: chargeId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setAudience(AUDIENCE)
    .setIssuer(ISSUER)
    .setSubject(chargeId)
    .setIssuedAt()
    .setExpirationTime(STUDIO_CHARGE_TOKEN_TTL)
    .sign(secretKey());
}

/** Returns the charge id for a valid pay-link token, or null. */
export async function verifyStudioChargeToken(token: unknown): Promise<string | null> {
  if (typeof token !== "string" || token.length < 20 || token.length > 2048) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      audience: AUDIENCE,
      issuer: ISSUER,
    });
    const cid = payload.cid;
    if (typeof cid !== "string" || cid !== payload.sub || !/^[a-f0-9]{24}$/i.test(cid)) return null;
    return cid;
  } catch {
    return null;
  }
}

export function tokenFromRequest(req: Request): string | null {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("t");
  if (fromQuery) return fromQuery;
  const auth = req.headers.get("authorization") || "";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
}
