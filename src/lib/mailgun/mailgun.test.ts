import test from "node:test";
import assert from "node:assert/strict";
import { config } from "@/lib/config";

test("mailgun dev email redirect logic", () => {
  const isDev = process.env.ENV === "development" || process.env.NODE_ENV === "development" || config.env === "development";
  const devEmail = isDev && config.mailgunDevEmail ? config.mailgunDevEmail.trim() : null;

  const originalRecipient = "customer@example.com";
  const recipient = devEmail || originalRecipient;

  if (config.mailgunDevEmail) {
    assert.equal(recipient, config.mailgunDevEmail.trim());
    assert.notEqual(recipient, originalRecipient);
  } else {
    assert.equal(recipient, originalRecipient);
  }
});
