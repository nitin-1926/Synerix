/**
 * Retry with jittered exponential backoff for image-provider HTTP calls.
 *
 * This existed three times — gemini.ts, provider.ts and runware.ts each carried
 * a near-identical copy. They had drifted: the Runware one omitted `overloaded`
 * and `high demand` from its transient set, so a provider brownout that the
 * other two rode out failed outright there. Consolidated on the SUPERSET, which
 * only ever means more retries on errors that genuinely are transient.
 *
 * Lives in its own module rather than in one of the three so importing it
 * cannot create a cycle between the providers.
 */

const TRANSIENT =
  /\b(429|5\d\d|overloaded|high demand|timeout|ETIMEDOUT|ECONNRESET|fetch failed)\b/i;

export async function withRetry<T>(
  fn: () => Promise<T>,
  o: { label: string; attempts: number; baseDelayMs: number },
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < o.attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const msg = (e as Error).message ?? String(e);
      if (i === o.attempts - 1 || !TRANSIENT.test(msg)) throw e;
      const wait = o.baseDelayMs * 2 ** i + Math.floor(Math.random() * 500);
      console.warn(`[retry:${o.label}] attempt ${i + 1}: ${msg.slice(0, 120)} — ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw last;
}
