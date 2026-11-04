import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const SHARED_DISALLOW = ["/admin", "/api", "/portal", "/book/success"];
const PUBLIC_ALLOW = ["/", "/llms.txt", "/llms-full.txt"];

/** Search and AI crawlers that may read public pages. Admin and API stay blocked. */
export const PUBLIC_CRAWLERS = [
  "Googlebot",
  "Google-Extended",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Applebot",
  "anthropic-ai",
] as const;

export default function robots(): MetadataRoute.Robots {
  const open = { allow: PUBLIC_ALLOW, disallow: SHARED_DISALLOW };
  return {
    rules: [
      { userAgent: "*", ...open },
      ...PUBLIC_CRAWLERS.map((userAgent) => ({ userAgent, ...open })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
