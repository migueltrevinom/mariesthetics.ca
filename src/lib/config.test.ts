import test from "node:test";
import assert from "node:assert/strict";
import { config, getAppUrl } from "./config";

const ENV_KEYS = [
  "ENV",
  "NODE_ENV",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
] as const;

type EnvPatch = Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>;

function isolated(overrides: EnvPatch = {}): EnvPatch {
  const cleared = Object.fromEntries(ENV_KEYS.map((key) => [key, undefined])) as EnvPatch;
  return { ...cleared, ...overrides };
}

async function withEnv(patch: EnvPatch, fn: () => Promise<void> | void) {
  const previous = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) previous.set(key, process.env[key]);
  for (const key of ENV_KEYS) {
    if (!(key in patch)) continue;
    const value = patch[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    await fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("getAppUrl returns localhost in development", async () => {
  await withEnv(
    isolated({
      ENV: "development",
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    }),
    () => {
      assert.equal(getAppUrl(), "http://localhost:3000");

      const req = new Request("http://localhost:3000/api/payments/deposit", {
        headers: { host: "localhost:3000" },
      });
      assert.equal(getAppUrl(req), "http://localhost:3000");
    },
  );
});

test("getAppUrl returns the production URL in production", async () => {
  await withEnv(isolated({ ENV: "production", NODE_ENV: "production" }), () => {
    assert.equal(getAppUrl(), "https://mariesthetics.ca");
  });
});

test("getAppUrl stays on the real site when production is mislabeled ENV=development", async () => {
  await withEnv(
    isolated({
      ENV: "development",
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    }),
    () => {
      assert.equal(getAppUrl(), "https://mariesthetics.ca");

      const req = new Request("http://localhost:3000/pay", {
        headers: { host: "localhost:3000", "x-forwarded-proto": "http" },
      });
      assert.equal(getAppUrl(req), "https://mariesthetics.ca");
      assert.equal(config.env, "production");
    },
  );
});

test("getAppUrl uses the real site when only VERCEL_ENV is production", async () => {
  await withEnv(
    isolated({
      ENV: "development",
      NODE_ENV: "development",
      VERCEL_ENV: "production",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    }),
    () => {
      assert.equal(getAppUrl(), "https://mariesthetics.ca");
    },
  );
});

test("getAppUrl uses the real site for a request that arrived at mariesthetics.ca", async () => {
  await withEnv(
    isolated({
      ENV: "development",
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    }),
    () => {
      const req = new Request("https://mariesthetics.ca/pay", {
        headers: {
          "x-forwarded-host": "mariesthetics.ca, localhost:3000",
          "x-forwarded-proto": "https",
          host: "localhost:3000",
        },
      });
      assert.equal(getAppUrl(req), "https://mariesthetics.ca");
      assert.equal(getAppUrl(), "http://localhost:3000");
    },
  );
});

test("getAppUrl keeps a non-production host while developing", async () => {
  await withEnv(isolated({ ENV: "development", NODE_ENV: "development" }), () => {
    const req = new Request("https://preview.example.test/pay", {
      headers: { host: "preview.example.test", "x-forwarded-proto": "https" },
    });
    assert.equal(getAppUrl(req), "https://preview.example.test");
  });
});

test("configured production site URL is used, and a localhost site URL is not", async () => {
  await withEnv(
    isolated({
      NODE_ENV: "production",
      ENV: "development",
      NEXT_PUBLIC_SITE_URL: "https://mariesthetics.ca/",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    }),
    () => {
      assert.equal(getAppUrl(), "https://mariesthetics.ca");
    },
  );

  await withEnv(
    isolated({
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    }),
    () => {
      assert.equal(getAppUrl(), "https://mariesthetics.ca");
    },
  );
});

test("config.env does not silently default to development on production runtimes", async () => {
  await withEnv(isolated({ NODE_ENV: "production" }), () => {
    assert.equal(config.env, "production");
  });

  await withEnv(isolated({ NODE_ENV: "production", ENV: "development" }), () => {
    assert.equal(config.env, "production");
  });

  await withEnv(isolated({ VERCEL_ENV: "production", ENV: "development", NODE_ENV: "development" }), () => {
    assert.equal(config.env, "production");
  });

  await withEnv(isolated(), () => {
    assert.equal(config.env, "development");
  });

  await withEnv(isolated({ NODE_ENV: "development" }), () => {
    assert.equal(config.env, "development");
  });
});
