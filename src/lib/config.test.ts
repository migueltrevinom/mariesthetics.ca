import test from "node:test";
import assert from "node:assert/strict";
import { getAppUrl } from "./config";

test("getAppUrl returns localhost in development", () => {
  const prevEnv = process.env.ENV;
  const prevNodeEnv = process.env.NODE_ENV;
  try {
    process.env.ENV = "development";
    (process.env as any).NODE_ENV = "development";

    assert.equal(getAppUrl(), "http://localhost:3000");

    const req = new Request("http://localhost:3000/api/payments/deposit", {
      headers: { host: "localhost:3000" },
    });
    assert.equal(getAppUrl(req), "http://localhost:3000");
  } finally {
    process.env.ENV = prevEnv;
    (process.env as any).NODE_ENV = prevNodeEnv;
  }
});

test("getAppUrl returns production URL in production", () => {
  const prevEnv = process.env.ENV;
  const prevNodeEnv = process.env.NODE_ENV;
  try {
    process.env.ENV = "production";
    (process.env as any).NODE_ENV = "production";

    assert.equal(getAppUrl(), "https://mariesthetics.ca");
  } finally {
    process.env.ENV = prevEnv;
    (process.env as any).NODE_ENV = prevNodeEnv;
  }
});
