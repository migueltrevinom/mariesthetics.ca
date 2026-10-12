import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const sharedDisallow = ["/admin", "/api", "/portal", "/book/success"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: sharedDisallow,
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/blog", "/llms.txt", "/llms-full.txt"],
        disallow: sharedDisallow,
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/blog", "/llms.txt", "/llms-full.txt"],
        disallow: sharedDisallow,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: sharedDisallow,
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/blog", "/llms.txt", "/llms-full.txt"],
        disallow: sharedDisallow,
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/blog", "/llms.txt", "/llms-full.txt"],
        disallow: sharedDisallow,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
