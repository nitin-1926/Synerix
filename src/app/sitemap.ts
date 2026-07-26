import type { MetadataRoute } from "next";
import { url } from "@/lib/site";

/** Only public, indexable marketing routes belong here — the product surface is
 * behind auth and is disallowed in robots.ts. */
const ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/synerix-studio", priority: 0.9, changeFrequency: "weekly" },
  { path: "/consulting", priority: 0.9, changeFrequency: "monthly" },
  { path: "/tests/business-health", priority: 0.7, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Build time is the honest lastModified for static marketing copy.
  const lastModified = new Date();
  return ROUTES.map((r) => ({
    url: url(r.path),
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
