import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

/**
 * Server-side Supabase Storage helpers. Single private bucket; all reads go
 * through short-lived signed URLs. Requires SUPABASE_SERVICE_ROLE_KEY.
 */

export const MEDIA_BUCKET = "media";

let adminClient: SupabaseClient | null = null;

function admin() {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase URL or SUPABASE_SERVICE_ROLE_KEY missing");
  adminClient = createClient(url, key, { auth: { persistSession: false } });
  return adminClient;
}

// Storage keys are immutable (a new version writes a new key), so caching
// signed URLs per key is safe. IMPORTANT: unstable_cache serves STALE entries
// while revalidating in the background, so a cached URL can be handed to the
// browser long after it was minted — the signature must outlive the entire
// cache window plus browsing time, or images break mid-session ("expired
// signature"). SIGNED_URL_VALIDITY_MARGIN buys that headroom.
const SIGNED_URL_REVALIDATE_SECONDS = 3300;
const SIGNED_URL_VALIDITY_MARGIN = SIGNED_URL_REVALIDATE_SECONDS * 2 + 3600;

export async function uploadBuffer(
  key: string,
  buf: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const { error } = await admin().storage.from(MEDIA_BUCKET).upload(key, buf, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`storage upload failed (${key}): ${error.message}`);
  return key;
}

export async function getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await admin()
    .storage.from(MEDIA_BUCKET)
    .createSignedUrl(key, expiresInSeconds);
  if (error || !data?.signedUrl) throw new Error(`signed url failed (${key}): ${error?.message}`);
  return data.signedUrl;
}

// Cached per key-array: one batch endpoint call per distinct key set, reused
// across renders until revalidation. A changed set (new render/version) is a
// miss that costs a single batch call.
const signUrlsCached = unstable_cache(
  async (keys: string[], expiresInSeconds: number): Promise<Record<string, string>> => {
    const { data, error } = await admin()
      .storage.from(MEDIA_BUCKET)
      .createSignedUrls(keys, expiresInSeconds + SIGNED_URL_VALIDITY_MARGIN);
    if (error || !data) throw new Error(`signed urls failed: ${error?.message}`);
    return Object.fromEntries(
      data.filter((d): d is typeof d & { path: string; signedUrl: string } => Boolean(d.path && d.signedUrl))
        .map((d) => [d.path, d.signedUrl]),
    );
  },
  ["signed-urls"],
  { revalidate: SIGNED_URL_REVALIDATE_SECONDS },
);

export async function getSignedUrls(
  keys: string[],
  expiresInSeconds = 3600,
): Promise<Record<string, string>> {
  if (!keys.length) return {};
  return signUrlsCached(keys, expiresInSeconds);
}

/**
 * Signed THUMBNAIL urls (Supabase image transform) for grids/galleries — much
 * lighter than full-res. Falls back to plain signed urls if transform fails.
 */
// Per-key cache (transforms have no batch endpoint — signing is one HTTPS call
// per key, so cache hits matter most at this granularity). Throws on failure so
// a transient error is never cached; the caller omits the key instead.
const signThumbUrlCached = unstable_cache(
  async (key: string, width: number, expiresInSeconds: number): Promise<string> => {
    const { data, error } = await admin()
      .storage.from(MEDIA_BUCKET)
      .createSignedUrl(key, expiresInSeconds + SIGNED_URL_VALIDITY_MARGIN, { transform: { width, resize: "contain" } });
    if (error || !data?.signedUrl) throw new Error(`signed thumb url failed (${key}): ${error?.message}`);
    return data.signedUrl;
  },
  ["signed-thumb-url"],
  { revalidate: SIGNED_URL_REVALIDATE_SECONDS },
);

export async function getSignedThumbUrls(
  keys: string[],
  width = 600,
  expiresInSeconds = 3600,
): Promise<Record<string, string>> {
  if (!keys.length) return {};
  const out: Record<string, string> = {};
  await Promise.all(
    keys.map(async (key) => {
      try {
        out[key] = await signThumbUrlCached(key, width, expiresInSeconds);
      } catch {
        // Skip this key — caller falls back to the plain signed url / placeholder.
      }
    }),
  );
  return out;
}

export async function downloadFromStorage(key: string): Promise<Buffer> {
  const { data, error } = await admin().storage.from(MEDIA_BUCKET).download(key);
  if (error || !data) throw new Error(`storage download failed (${key}): ${error?.message}`);
  return Buffer.from(await data.arrayBuffer());
}

/** Ensure the private media bucket exists (idempotent; call from setup script). */
export async function ensureMediaBucket(): Promise<void> {
  const client = admin();
  const { data } = await client.storage.getBucket(MEDIA_BUCKET);
  if (!data) {
    const { error } = await client.storage.createBucket(MEDIA_BUCKET, { public: false });
    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`createBucket failed: ${error.message}`);
    }
  }
}

// Storage key conventions
export const storageKeys = {
  brandAsset: (brandId: string, assetId: string, ext: string) =>
    `brands/${brandId}/assets/${assetId}.${ext}`,
  brandScreenshot: (brandId: string, name: string) => `brands/${brandId}/screenshots/${name}.png`,
  productImage: (productId: string, imageId: string, ext: string) =>
    `products/${productId}/${imageId}.${ext}`,
  productCutout: (productId: string, imageId: string) =>
    `products/${productId}/${imageId}-cutout.png`,
  masterPlate: (runId: string, conceptId: string) => `runs/${runId}/plates/${conceptId}.png`,
  iteration: (runId: string, conceptId: string, iter: number) =>
    `runs/${runId}/iterations/${conceptId}-${iter}.png`,
  composedRender: (creativeId: string, aspect: string, version: number) =>
    `creatives/${creativeId}/renders/${aspect.replace(":", "x")}-v${version}.png`,
  aiModelPreset: (slug: string) => `models/presets/${slug}.png`,
  aiModel: (modelId: string) => `models/brand/${modelId}.png`,
};
