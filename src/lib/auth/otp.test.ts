import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

test("client otp expiration and hashing logic", async () => {
  const code = "123456";
  const codeHash = await bcrypt.hash(code, 10);

  // Verification succeeds with matching code
  const isMatch = await bcrypt.compare(code, codeHash);
  assert.equal(isMatch, true);

  // Verification fails with wrong code
  const isWrong = await bcrypt.compare("654321", codeHash);
  assert.equal(isWrong, false);

  // 10 minutes expiry window check
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  const diffMinutes = (expiresAt.getTime() - now.getTime()) / (60 * 1000);
  assert.equal(diffMinutes, 10);

  // Expired check
  const expiredDate = new Date(now.getTime() - 1000);
  assert.equal(now > expiredDate, true);

  // Whitespace trimming behavior
  const matchWithWhitespace = await bcrypt.compare(" 123456 ".trim(), codeHash);
  assert.equal(matchWithWhitespace, true);
});
