import { test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";

import { signStudioChargeToken, verifyStudioChargeToken } from "./studioChargeToken";

// The secret is read at call time, so setting it here applies to every test.
process.env.STUDIO_CHARGE_JWT_SECRET = "test-secret-test-secret-test-secret-1234";
const id = "0123456789abcdef01234567";

test("round-trips a charge id", async () => {
  assert.equal(await verifyStudioChargeToken(await signStudioChargeToken(id)), id);
});

test("rejects missing, garbage and tampered tokens", async () => {
  assert.equal(await verifyStudioChargeToken(undefined), null);
  assert.equal(await verifyStudioChargeToken("not-a-jwt-not-a-jwt-xx"), null);
  const t = await signStudioChargeToken(id);
  assert.equal(await verifyStudioChargeToken(t.slice(0, -2) + "xx"), null);
});

test("rejects tokens signed with another secret or audience", async () => {
  const other = await new SignJWT({ cid: id }).setProtectedHeader({ alg: "HS256" }).setSubject(id)
    .setAudience("studio_charge").setIssuer("mariesthetics.ca").setExpirationTime("1h")
    .sign(new TextEncoder().encode("another-secret-another-secret-123456"));
  assert.equal(await verifyStudioChargeToken(other), null);
  const session = await new SignJWT({ role: "manager", email: "a@b.c" }).setProtectedHeader({ alg: "HS256" })
    .setSubject(id).setExpirationTime("1h").sign(new TextEncoder().encode(process.env.STUDIO_CHARGE_JWT_SECRET));
  assert.equal(await verifyStudioChargeToken(session), null);
});

test("rejects expired tokens", async () => {
  const expired = await new SignJWT({ cid: id }).setProtectedHeader({ alg: "HS256" }).setSubject(id)
    .setAudience("studio_charge").setIssuer("mariesthetics.ca").setIssuedAt(1).setExpirationTime(2)
    .sign(new TextEncoder().encode(process.env.STUDIO_CHARGE_JWT_SECRET));
  assert.equal(await verifyStudioChargeToken(expired), null);
});
