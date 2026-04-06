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
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
