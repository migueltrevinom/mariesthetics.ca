import assert from "node:assert/strict";
import { test } from "node:test";
import robots, { PUBLIC_CRAWLERS } from "./robots";

test("search and AI crawlers may read public pages, not admin or api", () => {
  const result = robots();
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
  const needed = ["*", ...PUBLIC_CRAWLERS];
  for (const bot of needed) {
    const rule = rules.find((r) => r.userAgent === bot);
    assert.ok(rule, bot);
    const allow = Array.isArray(rule.allow) ? rule.allow : [rule.allow];
    const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
    assert.ok(allow.includes("/"), bot);
    assert.ok(disallow.includes("/admin"), bot);
    assert.ok(disallow.includes("/api"), bot);
  }
  for (const bot of ["Googlebot", "Google-Extended", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Applebot"]) {
    assert.ok(needed.includes(bot), bot);
  }
});
