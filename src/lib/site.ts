/**
 * Canonical public origin. Everything SEO-facing (canonicals, sitemap, robots,
 * JSON-LD, OG image URLs) derives from this one value.
 *
 * Vercel preview deployments must NOT emit production canonicals — that is one
 * of the few SEO mistakes that can deindex a working site — so a non-production
 * Vercel environment falls back to its own deployment URL.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.WEBSITE_URL;
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    // VERCEL_URL first, and the order is the whole point: on a preview
    // deployment VERCEL_PROJECT_PRODUCTION_URL still holds the PRODUCTION
    // domain, so reading it first made every preview emit production
    // canonicals — the exact deindexing risk this branch exists to prevent.
    // VERCEL_URL is the per-deployment hostname.
    const preview = process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (preview) return `https://${preview}`;
  }
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      // A malformed env var must not take the marketing site down.
    }
  }
  return "https://www.synerix.in";
}

export const SITE_URL = resolveSiteUrl();

export const SITE = {
  name: "Synerix",
  legalName: "Synerix",
  tagline: "Business consulting for Indian MSMEs, and AI ad creatives that look shot, not generated.",
  email: "consulting.synerix@gmail.com",
  city: "Ludhiana",
  region: "Punjab",
  country: "IN",
} as const;

/** Absolute URL for a site-relative path (canonicals, sitemap, JSON-LD). */
export const url = (path = "/") => new URL(path, SITE_URL).toString();
