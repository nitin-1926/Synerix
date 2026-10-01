import { unstable_cache } from "next/cache";
import { auth as triggerAuth } from "@trigger.dev/sdk";

/**
 * Read-only Trigger.dev realtime token for one run, cached. The studio page
 * re-renders on every progress tick and each render minted a fresh token — a
 * cross-region API call (~100-400ms) in front of every RSC response, roughly 15
 * times per generation. The token is scoped to a single run id, so sharing it
 * is safe. It lives 1h and is reused for at most 25 min, so a handed-out token
 * always has 35+ min left (a 30-min token cached for 25 could reach the browser
 * with 5 min left and silently kill the live progress subscription).
 */
const mint = unstable_cache(
  (triggerRunId: string) =>
    triggerAuth.createPublicToken({ scopes: { read: { runs: [triggerRunId] } }, expirationTime: "1h" }),
  ["trigger-realtime-token"],
  { revalidate: 25 * 60 },
);

export async function realtimeToken(triggerRunId: string): Promise<string | null> {
  // A thrown mint is not cached, so a transient failure retries on the next render.
  return mint(triggerRunId).catch(() => null);
}
