import type { MetadataRoute } from "next";

/** Open to everyone, including AI crawlers; the site is the résumé. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot", "Applebot-Extended"], allow: "/" },
    ],
    sitemap: "https://josh.design/sitemap.xml",
  };
}
