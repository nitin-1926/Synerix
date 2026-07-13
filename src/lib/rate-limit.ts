// In-memory sliding-window rate limiter for the public (unauthenticated)
// API routes. Per-instance only: on serverless each instance keeps its own
// window, so the effective limit scales with instance count — acceptable at
// current traffic; swap for a shared store (Upstash/Redis) if that changes.

const buckets = new Map<string, number[]>();
const MAX_KEYS = 5_000;

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): boolean {
  // No client IP resolvable (bare `next start`, no reverse proxy — dev and
  // self-hosted smoke tests): every visitor would share one bucket and a
  // 3/hour route would brick site-wide after three requests. Fail open there;
  // on Vercel x-real-ip is always present so this branch never runs in prod.
  if (key.endsWith(":unknown")) return true;
  const now = Date.now();
  if (buckets.size > MAX_KEYS) {
    for (const [k, hits] of buckets) {
      if ((hits[hits.length - 1] ?? 0) < now - windowMs) buckets.delete(k);
    }
  }
  const hits = (buckets.get(key) ?? []).filter((t) => t > now - windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

export function clientIp(req: Request): string {
  // x-real-ip is set by the platform (Vercel) from the actual connection and
  // cannot be spoofed by the caller. The LEFTMOST x-forwarded-for value is
  // client-controlled — trusting it lets an attacker rotate a header per
  // request and bypass every limit — so it is only a last-resort fallback,
  // and we take the RIGHTMOST hop there (appended by the trusted proxy).
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return "unknown";
}
