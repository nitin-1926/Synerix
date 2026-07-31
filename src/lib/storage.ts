import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as presign } from "@aws-sdk/s3-request-presigner";
import { unstable_cache } from "next/cache";
import sharp from "sharp";

/**
 * Server-side object storage on Cloudflare R2 (S3-compatible API).
 *
 * Private bucket; every read is a short-lived presigned URL, exactly as the
 * Supabase implementation worked. Two things changed with the move:
 *
 *  1. Presigning is a LOCAL signature computation — no network round trip —
 *     where Supabase charged an HTTPS call per key (or per batch). Signing is
 *     effectively free now.
 *  2. R2 has no server-side image transform, so thumbnails are generated with
 *     sharp at upload time and stored as sibling objects.
 */

export const BUCKET = process.env.R2_BUCKET ?? "synerix-studio";

let client: S3Client | null = null;

function r2(): S3Client {
  if (client) return client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY missing");
  }
  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

// Signing is local and free, so this cache is no longer about avoiding API
// calls — it is about URL STABILITY. A freshly signed URL on every render is a
// new URL, which misses the browser's image cache and re-downloads a multi-MB
// PNG the user already has. Holding the URL steady for the window keeps those
// hits. unstable_cache serves stale entries while revalidating, so the
// signature must outlive the cache window plus browsing time.
const SIGNED_URL_REVALIDATE_SECONDS = 3300;
const SIGNED_URL_VALIDITY_MARGIN = SIGNED_URL_REVALIDATE_SECONDS * 2 + 3600;

/**
 * One thumbnail width for every image, not one per requested width.
 *
 * ponytail: single 600px webp; add per-width variants only if a surface proves
 * it needs them. Callers ask for 160/200/400/600, but a 600px webp is already
 * ~50x smaller than the source PNG, so re-encoding four variants would multiply
 * storage and upload latency to save a few KB on the small ones. `width` on the
 * read path is therefore advisory.
 */
const THUMB_WIDTH = 600;
const thumbKey = (key: string) => `${key}.thumb.webp`;

export async function uploadBuffer(
  key: string,
  buf: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const body = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  await r2().send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }),
  );

  // Thumbnail generation must never fail an upload: the original is what the
  // pipeline depends on.
  //
  // On sharp failure we still WRITE the thumb key, using the original bytes.
  // That looks wasteful but it upholds an invariant the read path depends on:
  // presigning is a local computation that cannot fail, so getSignedThumbUrls
  // always hands back a URL. Under Supabase a broken thumbnail was omitted from
  // the map and callers rendered nothing; here an absent object would instead
  // 404 behind a perfectly valid URL and show a broken-image icon — and in the
  // library grid the thumb is the ONLY url, so there is nothing to fall back to.
  // Storing the original keeps the picture correct at the cost of bytes on a
  // path that should essentially never run.
  if (contentType.startsWith("image/")) {
    let thumb = body;
    let thumbType = contentType;
    try {
      thumb = await sharp(body)
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      thumbType = "image/webp";
    } catch (e) {
      console.warn(
        `[storage] thumbnail generation failed for ${key} (${(e as Error).message}) — storing full-size as the thumbnail`,
      );
    }
    await r2().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: thumbKey(key),
        Body: thumb,
        ContentType: thumbType,
      }),
    );
  }

  return key;
}

/**
 * Delete objects and their thumbnail siblings.
 *
 * Storage had no delete path at all: deleting a product or a brand model
 * removed the DB rows and orphaned every object forever. The thumbnails added
 * with the R2 move doubled that leak, since each original now has a sibling.
 * Anything that hard-deletes a row owning a storageKey must call this.
 */
export async function deleteObjects(keys: string[]): Promise<void> {
  const all = keys.filter(Boolean).flatMap((k) => [{ Key: k }, { Key: thumbKey(k) }]);
  if (!all.length) return;
  // DeleteObjects caps at 1000 keys per request.
  for (let i = 0; i < all.length; i += 1000) {
    const batch = all.slice(i, i + 1000);
    // Quiet mode: R2 reports no error for a key that was already absent, which
    // is what we want — deleting a thumbnail that never existed is not a fault.
    const res = await r2().send(
      new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: batch, Quiet: true } }),
    );
    for (const err of res.Errors ?? []) {
      console.warn(`[storage] delete failed for ${err.Key}: ${err.Message}`);
    }
  }
}

export async function getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  return presign(r2(), new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: expiresInSeconds,
  });
}

const signUrlsCached = unstable_cache(
  async (keys: string[], expiresInSeconds: number): Promise<Record<string, string>> => {
    const ttl = expiresInSeconds + SIGNED_URL_VALIDITY_MARGIN;
    const signed = await Promise.all(
      keys.map(async (key) => [key, await getSignedUrl(key, ttl)] as const),
    );
    return Object.fromEntries(signed);
  },
  ["r2-signed-urls"],
  { revalidate: SIGNED_URL_REVALIDATE_SECONDS },
);

export async function getSignedUrls(
  keys: string[],
  expiresInSeconds = 3600,
): Promise<Record<string, string>> {
  if (!keys.length) return {};
  return signUrlsCached(keys, expiresInSeconds);
}

const signThumbUrlsCached = unstable_cache(
  async (keys: string[], expiresInSeconds: number): Promise<Record<string, string>> => {
    const ttl = expiresInSeconds + SIGNED_URL_VALIDITY_MARGIN;
    const signed = await Promise.all(
      keys.map(async (key) => [key, await getSignedUrl(thumbKey(key), ttl)] as const),
    );
    return Object.fromEntries(signed);
  },
  ["r2-signed-thumb-urls"],
  { revalidate: SIGNED_URL_REVALIDATE_SECONDS },
);

/**
 * Signed THUMBNAIL urls, keyed by the ORIGINAL key so callers are unchanged.
 * `width` is advisory — see THUMB_WIDTH. A key whose thumbnail was never
 * generated returns a URL that 404s; every caller already falls back to the
 * full-size url or a placeholder.
 */
export async function getSignedThumbUrls(
  keys: string[],
  // Kept so the 8 existing call sites compile unchanged; see THUMB_WIDTH for
  // why a single width now serves all of them.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _width = THUMB_WIDTH,
  expiresInSeconds = 3600,
): Promise<Record<string, string>> {
  if (!keys.length) return {};
  return signThumbUrlsCached(keys, expiresInSeconds);
}

export async function downloadFromStorage(key: string): Promise<Buffer> {
  const res = await r2().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  if (!res.Body) throw new Error(`storage download failed (${key}): empty body`);
  return Buffer.from(await res.Body.transformToByteArray());
}

/** Ensure the private bucket exists (idempotent; call from setup script). */
export async function ensureMediaBucket(): Promise<void> {
  try {
    await r2().send(new HeadBucketCommand({ Bucket: BUCKET }));
    return;
  } catch {
    // Falls through to create — HeadBucket throws on both "missing" and
    // "no permission to head", and CreateBucket surfaces the real reason.
  }
  try {
    await r2().send(new CreateBucketCommand({ Bucket: BUCKET }));
  } catch (e) {
    const msg = (e as Error).message;
    if (!/BucketAlreadyOwnedByYou|already exists/i.test(msg)) {
      throw new Error(`createBucket failed: ${msg}`);
    }
  }
}

/** Filesystem-safe segment for a path component. */
export const sanitizeSegment = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "untitled";

/**
 * The per-creative prefix: {workspace}/{userId}/{unix seconds}-{short id}.
 *
 * The short id is NOT decoration. A bare {workspace}/{userId}/{seconds} is not
 * unique — concepts inside one run are rendered concurrently and land in the
 * same second, and the backfill over 85 existing creatives produced only 82
 * distinct prefixes. Three sets of renders would have overwritten each other.
 * conceptIndex does not fix it either: two of those collisions came from
 * DIFFERENT runs that shared conceptIndex 0. Only the creative id is unique,
 * and Creative.storagePrefix carries a unique index so this cannot regress.
 *
 * Computed once and stored — see the schema comment for why it is frozen.
 */
export const creativeStoragePrefix = (p: {
  workspaceSlug: string;
  userId: string;
  createdAt: Date;
  creativeId: string;
}) =>
  `${sanitizeSegment(p.workspaceSlug)}/${p.userId}/${Math.floor(
    p.createdAt.getTime() / 1000,
  )}-${p.creativeId.slice(0, 8)}`;

/**
 * Prefix to write a creative's renders under. Falls back to the pre-R2 layout
 * for any row the backfill missed, which keeps old and new creatives readable
 * through one code path instead of branching at every call site.
 */
export const renderPrefix = (c: { id: string; storagePrefix: string | null }) =>
  c.storagePrefix ?? `creatives/${c.id}/renders`;

// Storage key conventions
export const storageKeys = {
  brandAsset: (brandId: string, assetId: string, ext: string) =>
    `brands/${brandId}/assets/${assetId}.${ext}`,
  brandScreenshot: (brandId: string, name: string) => `brands/${brandId}/screenshots/${name}.png`,
  productImage: (productId: string, imageId: string, ext: string) =>
    `products/${productId}/${imageId}.${ext}`,
  productCutout: (productId: string, imageId: string) =>
    `products/${productId}/${imageId}-cutout.png`,
  // NOTE: `runs/{runId}/plates/` holds the ONLY copy of each master plate, and
  // the editor re-composites from it on every edit — it is not run scratch.
  // Never point an R2 lifecycle expiry at `runs/`; it would silently kill
  // editing on every creative older than the window. There is no longer any
  // scratch prefix to expire: the `iteration()` builder that once wrote
  // `runs/{id}/iterations/` had no caller and was removed. The 24 leftover
  // objects it produced were never migrated off Supabase.
  masterPlate: (runId: string, conceptId: string) => `runs/${runId}/plates/${conceptId}.png`,
  /**
   * Finished creative renders live under the creative's frozen prefix.
   *
   * Takes an OBJECT deliberately. The previous signature was
   * (creativeId, aspect, version) — all (string, string, number) — so swapping
   * the first argument to a prefix compiled clean at every call site while
   * silently writing to the wrong path. A named field forces each one to be
   * revisited.
   */
  composedRender: (p: { prefix: string; aspect: string; version: number }) =>
    `${p.prefix}/${p.aspect.replace(":", "x")}-v${p.version}.png`,
  aiModelPreset: (slug: string) => `models/presets/${slug}.png`,
  aiModel: (modelId: string) => `models/brand/${modelId}.png`,
};
