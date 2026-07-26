import { auth as triggerAuth } from "@trigger.dev/sdk";

/**
 * Read-only Trigger.dev realtime token for one run, cached in the server
 * process. The studio page re-renders on every progress tick and each render
 * minted a fresh token — a cross-region API call (~100-400ms) sitting in front
 * of every RSC response, roughly 15 times per generation. The token is scoped
 * to a single run id and expires on its own, so caching it is safe; we expire
 * the entry before the token itself so a stale token is never handed out.
 */
const TTL_MS = 25 * 60 * 1000;
const cache = new Map<string, { token: string; expiresAt: number }>();

export async function realtimeToken(triggerRunId: string): Promise<string | null> {
  const hit = cache.get(triggerRunId);
  if (hit && hit.expiresAt > Date.now()) return hit.token;
  try {
    const token = await triggerAuth.createPublicToken({
      scopes: { read: { runs: [triggerRunId] } },
      expirationTime: "30m",
    });
    cache.set(triggerRunId, { token, expiresAt: Date.now() + TTL_MS });
    // Bound the map: a long-lived server instance would otherwise accumulate
    // one entry per run it has ever rendered.
    if (cache.size > 500) {
      for (const [k, v] of cache) if (v.expiresAt <= Date.now()) cache.delete(k);
    }
    return token;
  } catch {
    return null;
  }
}
