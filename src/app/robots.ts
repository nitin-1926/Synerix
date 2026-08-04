import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Crawl policy. AI answer-engine crawlers (GPTBot, ClaudeBot, PerplexityBot,
 * Google-Extended, CCBot) are ALLOWED on the marketing pages on purpose: this
 * business is discovered through questions like "AI ad creative for Indian
 * brands", and being quotable in an answer engine is worth more than the
 * content being scraped. The product and admin surfaces are disallowed for
 * every agent — they are behind auth and must never be indexed or summarised.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/dashboard", "/studio", "/library", "/products", "/brand", "/models", "/settings", "/onboarding", "/admin", "/login", "/request-access", "/api/"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
