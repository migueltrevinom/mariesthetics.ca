import test from "node:test";
import assert from "node:assert/strict";
import { resolveOutboundEmail, routeOutboundEmail } from "./devRedirect";
import { sendEmail } from "@/lib/mailgun";
import { emailOtpProvider } from "@/lib/auth/providers/email";

const ENV_KEYS = [
  "ENV",
  "NODE_ENV",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "MAILGUN_DEV_EMAIL",
  "MAILGUN_API_KEY",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
] as const;

type EnvPatch = Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>;

function isolated(overrides: EnvPatch = {}): EnvPatch {
  const cleared = Object.fromEntries(ENV_KEYS.map((key) => [key, undefined])) as EnvPatch;
  return { ...cleared, ...overrides };
}

const localDev = isolated({
  ENV: "development",
  NODE_ENV: "development",
  MAILGUN_DEV_EMAIL: "dev@example.com",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SITE_URL: "https://mariesthetics.ca",
});

async function withEnv(patch: EnvPatch, fn: (warnings: string[]) => Promise<void> | void) {
  const previous = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) previous.set(key, process.env[key]);
  for (const key of ENV_KEYS) {
    if (!(key in patch)) continue;
    const value = patch[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = ((...args: unknown[]) => {
    warnings.push(args.map((arg) => String(arg)).join(" "));
  }) as typeof console.warn;
  try {
    await fn(warnings);
  } finally {
    console.warn = originalWarn;
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function assertNotRedirected(to: string, subject: string, warnings: string[]) {
  const routed = routeOutboundEmail(to, subject);
  assert.equal(routed.redirected, false);
  assert.equal(routed.to, to);
  assert.equal(routed.subject, subject);
  assert.equal(routed.subject.includes("[DEV:"), false);
  const text = warnings.join("\n");
  assert.equal(text.includes("DEV REDIRECT ACTIVE"), false);
  assert.match(text, /Dev mailbox redirect is disabled/);
}

test("production never redirects when ENV=development and MAILGUN_DEV_EMAIL are set", async () => {
  const incident = {
    ENV: "development",
    MAILGUN_DEV_EMAIL: "dev@example.com",
    NEXT_PUBLIC_SITE_URL: "https://mariesthetics.ca",
  };

  await withEnv(isolated({ ...incident, NODE_ENV: "production", VERCEL_ENV: "production" }), (warnings) => {
    assertNotRedirected("customer@example.com", "Your Mari Esthetics login code", warnings);
  });

  await withEnv(isolated({ ...incident, NODE_ENV: "production" }), (warnings) => {
    assertNotRedirected("customer@example.com", "Booking confirmed", warnings);
  });

  await withEnv(
    isolated({ ...incident, NODE_ENV: "development", VERCEL_ENV: "production" }),
    (warnings) => {
      assertNotRedirected("customer@example.com", "Payment link", warnings);
    },
  );

  await withEnv(isolated({ ...incident, NODE_ENV: "development", VERCEL_ENV: "Production" }), (warnings) => {
    assertNotRedirected("customer@example.com", "Review request", warnings);
  });
});

test("the real site host never redirects, even in a development process", async () => {
  await withEnv(localDev, (warnings) => {
    for (const host of ["mariesthetics.ca", "www.mariesthetics.ca", "https://mariesthetics.ca/pay", "book.mariesthetics.ca"]) {
      const routed = routeOutboundEmail("customer@example.com", "Payment link", host);
      assert.equal(routed.redirected, false, host);
      assert.equal(routed.to, "customer@example.com", host);
      assert.equal(routed.subject, "Payment link", host);
    }
    const text = warnings.join("\n");
    assert.match(text, /Dev mailbox redirect is disabled/);
    assert.equal(text.includes("DEV REDIRECT ACTIVE"), false);
  });

  await withEnv(isolated({ ...localDev, VERCEL_URL: "mariesthetics.ca" }), (warnings) => {
    assertNotRedirected("customer@example.com", "Payment link", warnings);
  });
});

test("request host lookup outside a request does not throw or weaken the guard", async () => {
  await withEnv(localDev, async () => {
    const routed = await resolveOutboundEmail("customer@example.com", "Hello");
    assert.equal(routed.redirected, true);
    assert.equal(routed.to, "dev@example.com");
  });

  await withEnv(
    isolated({
      ENV: "development",
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      MAILGUN_DEV_EMAIL: "dev@example.com",
    }),
    async () => {
      const routed = await resolveOutboundEmail("customer@example.com", "Hello");
      assert.equal(routed.redirected, false);
      assert.equal(routed.to, "customer@example.com");
      assert.equal(routed.subject, "Hello");
    },
  );
});

test("local development still redirects to MAILGUN_DEV_EMAIL", async () => {
  await withEnv(localDev, (warnings) => {
    const routed = routeOutboundEmail("customer@example.com", "Your Mari Esthetics login code", "localhost:3000");
    assert.equal(routed.redirected, true);
    assert.equal(routed.to, "dev@example.com");
    assert.equal(routed.subject, "[DEV: originally to customer@example.com] Your Mari Esthetics login code");
    assert.match(warnings.join("\n"), /DEV REDIRECT ACTIVE/);
  });

  await withEnv(isolated({ NODE_ENV: "development", MAILGUN_DEV_EMAIL: "  dev@example.com  " }), (warnings) => {
    const routed = routeOutboundEmail("customer@example.com", "Hello");
    assert.equal(routed.to, "dev@example.com");
    assert.equal(routed.redirected, true);
    assert.match(warnings.join("\n"), /DEV REDIRECT ACTIVE/);
  });

  await withEnv(
    isolated({
      NODE_ENV: "development",
      VERCEL_ENV: "preview",
      VERCEL_URL: "mariesthetics-git-preview.vercel.app",
      MAILGUN_DEV_EMAIL: "dev@example.com",
    }),
    () => {
      const routed = routeOutboundEmail("customer@example.com", "Hello");
      assert.equal(routed.redirected, true);
      assert.equal(routed.to, "dev@example.com");
    },
  );
});

test("lookalike hosts still redirect locally, and a blank dev inbox never does", async () => {
  await withEnv(localDev, (warnings) => {
    const lookalike = routeOutboundEmail("customer@example.com", "Hello", "mariesthetics.ca.evil.com");
    assert.equal(lookalike.redirected, true);
    assert.equal(lookalike.to, "dev@example.com");

    const other = routeOutboundEmail("customer@example.com", "Hello", "notmariesthetics.ca");
    assert.equal(other.redirected, true);
    assert.match(warnings.join("\n"), /DEV REDIRECT ACTIVE/);
  });

  await withEnv(isolated({ NODE_ENV: "development", ENV: "development", MAILGUN_DEV_EMAIL: "   " }), (warnings) => {
    const routed = routeOutboundEmail("customer@example.com", "Hello");
    assert.equal(routed.redirected, false);
    assert.equal(routed.to, "customer@example.com");
    assert.equal(warnings.length, 0);
  });
});

type CapturedMail = { url: string; to: string; subject: string };

async function withFetch(fn: (calls: CapturedMail[]) => Promise<void>) {
  const calls: CapturedMail[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body;
    if (body instanceof FormData) {
      calls.push({ url, to: String(body.get("to")), subject: String(body.get("subject")) });
    } else if (typeof body === "string") {
      const json = JSON.parse(body) as { to?: string | string[]; subject?: string };
      const to = Array.isArray(json.to) ? String(json.to[0]) : String(json.to);
      calls.push({ url, to, subject: String(json.subject) });
    }
    return new Response(JSON.stringify({ id: "<test@mailgun>" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  try {
    await fn(calls);
  } finally {
    globalThis.fetch = original;
  }
}

test("sendEmail on production posts to the original recipient", async () => {
  await withEnv(
    isolated({
      ENV: "development",
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      MAILGUN_DEV_EMAIL: "dev@example.com",
      MAILGUN_API_KEY: "key-test",
    }),
    async () => {
      await withFetch(async (calls) => {
        const result = await sendEmail({
          to: "customer@example.com",
          subject: "Your Mari Esthetics login code",
          html: "<p>123456</p>",
          host: "localhost:3000",
        });
        assert.equal(result.success, true);
        assert.equal(calls.length, 1);
        assert.match(calls[0].url, /api\.mailgun\.net/);
        assert.equal(calls[0].to, "customer@example.com");
        assert.equal(calls[0].subject, "Your Mari Esthetics login code");
      });
    },
  );
});

test("sendEmail in local development redirects to the dev inbox", async () => {
  await withEnv(
    isolated({
      ENV: "development",
      NODE_ENV: "development",
      MAILGUN_DEV_EMAIL: "dev@example.com",
      MAILGUN_API_KEY: "key-test",
      NEXT_PUBLIC_SITE_URL: "https://mariesthetics.ca",
    }),
    async () => {
      await withFetch(async (calls) => {
        const result = await sendEmail({
          to: "customer@example.com",
          subject: "Booking confirmed",
          html: "<p>see you soon</p>",
          host: "localhost:3000",
        });
        assert.equal(result.success, true);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].to, "dev@example.com");
        assert.equal(calls[0].subject, "[DEV: originally to customer@example.com] Booking confirmed");
      });
    },
  );
});

test("sendEmail refuses the redirect when the request host is the real site", async () => {
  await withEnv(
    isolated({
      ENV: "development",
      NODE_ENV: "development",
      MAILGUN_DEV_EMAIL: "dev@example.com",
      MAILGUN_API_KEY: "key-test",
    }),
    async () => {
      await withFetch(async (calls) => {
        const result = await sendEmail({
          to: "customer@example.com",
          subject: "Payment link",
          html: "<p>pay</p>",
          host: "www.mariesthetics.ca",
        });
        assert.equal(result.success, true);
        assert.equal(calls[0].to, "customer@example.com");
        assert.equal(calls[0].subject, "Payment link");
      });
    },
  );
});

test("Resend fallback never redirects on production and still redirects locally", async () => {
  const sendOtp = async () => {
    await emailOtpProvider.send({
      target: "customer@example.com",
      code: "123456",
      purpose: "client_login",
    });
  };

  await withEnv(
    isolated({
      ENV: "development",
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      MAILGUN_DEV_EMAIL: "dev@example.com",
      RESEND_API_KEY: "re_test",
    }),
    async () => {
      await withFetch(async (calls) => {
        await sendOtp();
        assert.equal(calls.length, 1);
        assert.match(calls[0].url, /api\.resend\.com\/emails/);
        assert.equal(calls[0].to, "customer@example.com");
        assert.equal(calls[0].subject, "Your Mari Esthetics login code");
      });
    },
  );

  await withEnv(
    isolated({
      ENV: "development",
      NODE_ENV: "development",
      MAILGUN_DEV_EMAIL: "dev@example.com",
      RESEND_API_KEY: "re_test",
      NEXT_PUBLIC_SITE_URL: "https://mariesthetics.ca",
    }),
    async () => {
      await withFetch(async (calls) => {
        await sendOtp();
        assert.equal(calls.length, 1);
        assert.equal(calls[0].to, "dev@example.com");
        assert.equal(calls[0].subject, "[DEV: originally to customer@example.com] Your Mari Esthetics login code");
      });
    },
  );
});

test("console OTP fallback reports the redirect only outside production", async () => {
  await withEnv(
    isolated({
      ENV: "development",
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      MAILGUN_DEV_EMAIL: "dev@example.com",
    }),
    async (warnings) => {
      let line = "";
      const originalInfo = console.info;
      console.info = ((...args: unknown[]) => {
        line = args.map((arg) => String(arg)).join(" ");
      }) as typeof console.info;
      try {
        await emailOtpProvider.send({
          target: "customer@example.com",
          code: "123456",
          purpose: "client_login",
        });
      } finally {
        console.info = originalInfo;
      }
      assert.match(line, /Dev redirect: none/);
      assert.equal(line.includes("dev@example.com"), false);
      assert.match(warnings.join("\n"), /Dev mailbox redirect is disabled/);
    },
  );

  await withEnv(localDev, async (warnings) => {
    let line = "";
    const originalInfo = console.info;
    console.info = ((...args: unknown[]) => {
      line = args.map((arg) => String(arg)).join(" ");
    }) as typeof console.info;
    try {
      await emailOtpProvider.send({
        target: "customer@example.com",
        code: "123456",
        purpose: "client_login",
      });
    } finally {
      console.info = originalInfo;
    }
    assert.match(line, /Dev redirect: dev@example.com/);
    assert.match(warnings.join("\n"), /DEV REDIRECT ACTIVE/);
  });
});
