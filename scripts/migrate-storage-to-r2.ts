/**
 * One-time migration: Supabase Storage (`media`) -> Cloudflare R2.
 *
 * Supabase has no server-side copy to a foreign provider, so every object is
 * pulled down and pushed up through this process. Two things happen per object:
 *
 *  1. The bytes move, and a 600px webp thumbnail is generated on the way (R2
 *     has no on-the-fly transform; uploadBuffer writes the sibling).
 *  2. Creative renders are RE-KEYED to the new frozen prefix
 *     {workspace.slug}/{createdByUserId}/{unix seconds}. Every other prefix
 *     (products/, brands/, models/, runs/) keeps its key verbatim.
 *
 * Idempotent and resumable: an object already in R2 is skipped, and the DB
 * key rewrite is a no-op once applied.
 *
 * `runs/<id>/iterations/` is deliberately NOT migrated — QA-reject scratch that
 * nothing reads. `runs/<id>/plates/` IS migrated: the editor re-composites from
 * masterPlateKey on every edit, so dropping plates would silently kill editing.
 *
 *   SRC_SUPABASE_URL=https://<ref>.supabase.co \
 *   SRC_SERVICE_ROLE_KEY=<supabase service role key> \
 *   npx tsx scripts/migrate-storage-to-r2.ts            # dry run
 *   npx tsx scripts/migrate-storage-to-r2.ts --apply
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { uploadBuffer, BUCKET, renderPrefix } from "../src/lib/storage";

const SRC_BUCKET = "media";
const CONCURRENCY = 4;
const APPLY = process.argv.includes("--apply");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function source(): SupabaseClient {
  const url = process.env.SRC_SUPABASE_URL;
  const key = process.env.SRC_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SRC_SUPABASE_URL / SRC_SERVICE_ROLE_KEY missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

function r2Probe(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/** Supabase list() is one directory deep and pages at 1000, so walk it. */
async function listAll(src: SupabaseClient, prefix = ""): Promise<string[]> {
  const out: string[] = [];
  const stack = [prefix];
  while (stack.length) {
    const dir = stack.pop()!;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await src.storage
        .from(SRC_BUCKET)
        .list(dir, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
      if (error) throw new Error(`list failed (${dir}): ${error.message}`);
      if (!data?.length) break;
      for (const entry of data) {
        const full = dir ? `${dir.replace(/\/$/, "")}/${entry.name}` : entry.name;
        if (entry.id === null) stack.push(full);
        else out.push(full);
      }
      if (data.length < 1000) break;
    }
  }
  return out;
}

/**
 * Old creative render keys were creatives/{creativeId}/renders/{aspect}-v{n}.png.
 * Map each to the creative's frozen prefix. Anything that does not match that
 * shape keeps its key.
 */
async function buildRenderKeyMap(): Promise<Map<string, string>> {
  const creatives = await prisma.creative.findMany({
    select: { id: true, storagePrefix: true },
  });
  const byId = new Map(creatives.map((c) => [c.id, c]));
  const map = new Map<string, string>();

  const rows = [
    ...(await prisma.creativeRender.findMany({ select: { creativeId: true, composedImageKey: true } })),
    ...(await prisma.creativeVersion.findMany({ select: { creativeId: true, composedImageKey: true } })),
  ];
  for (const row of rows) {
    const oldKey = row.composedImageKey;
    if (!oldKey || map.has(oldKey)) continue;
    const creative = byId.get(row.creativeId);
    if (!creative?.storagePrefix) continue; // no prefix -> leave key untouched
    const leaf = oldKey.split("/").pop();
    if (!leaf) continue;
    map.set(oldKey, `${renderPrefix(creative)}/${leaf}`);
  }
  return map;
}

async function existsInR2(probe: S3Client, key: string): Promise<boolean> {
  try {
    await probe.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Resume test. Checks the THUMBNAIL too, not just the original.
 *
 * uploadBuffer writes the original first and only then the thumbnail, so
 * "original present" does not imply "pair complete". Skipping on the original
 * alone meant a run that died between the two writes could never repair itself:
 * the resume would mark the object done and the thumbnail would stay missing
 * forever, with nothing in the output saying so.
 */
async function alreadyMigrated(probe: S3Client, key: string, isImage: boolean): Promise<boolean> {
  if (!(await existsInR2(probe, key))) return false;
  return isImage ? existsInR2(probe, `${key}.thumb.webp`) : true;
}

async function main() {
  const src = source();
  const probe = r2Probe();

  const all = await listAll(src);
  const objects = all.filter((k) => !/^runs\/[^/]+\/iterations\//.test(k));
  const skippedScratch = all.length - objects.length;

  const renderKeyMap = await buildRenderKeyMap();
  const plan = objects.map((key) => ({ from: key, to: renderKeyMap.get(key) ?? key }));
  const rekeyed = plan.filter((p) => p.from !== p.to).length;

  console.log(`${all.length} objects in Supabase`);
  console.log(`  ${skippedScratch} skipped (runs/<id>/iterations scratch)`);
  console.log(`  ${objects.length} to migrate, of which ${rekeyed} re-keyed to the new creative prefix`);

  // Refuse to run a plan that maps two sources onto one destination. This is
  // the generic form of the collision found by hand before the first run (85
  // creatives had collapsed to 82 prefixes): without it the migration reports
  // "copied N, failed 0" while one object silently overwrites another.
  const dests = new Set(plan.map((p) => p.to));
  if (dests.size !== plan.length) {
    const seen = new Set<string>();
    const dupes = plan.map((p) => p.to).filter((t) => (seen.has(t) ? true : (seen.add(t), false)));
    console.error(`\nABORT: ${plan.length - dests.size} destination key collision(s) — objects would overwrite each other:`);
    for (const d of [...new Set(dupes)].slice(0, 10)) console.error(`  ${d}`);
    process.exit(1);
  }

  if (!APPLY) {
    for (const p of plan.filter((x) => x.from !== x.to).slice(0, 10)) {
      console.log(`  rekey  ${p.from}\n      -> ${p.to}`);
    }
    console.log("\ndry run — pass --apply to migrate");
    return;
  }

  let copied = 0;
  let skipped = 0;
  const failures: Array<{ from: string; message: string }> = [];
  let cursor = 0;

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < plan.length) {
        const { from, to } = plan[cursor++];
        try {
          // Content type is only known after download, so guess from the
          // extension for the resume check; a wrong guess costs one HEAD.
          const looksImage = /\.(png|jpe?g|webp|gif|avif|tiff?|svg)$/i.test(to);
          if (await alreadyMigrated(probe, to, looksImage)) {
            skipped++;
          } else {
            const { data, error } = await src.storage.from(SRC_BUCKET).download(from);
            if (error || !data) throw new Error(`download: ${error?.message}`);
            const buf = Buffer.from(await data.arrayBuffer());
            // uploadBuffer also writes the 600px webp thumbnail sibling.
            await uploadBuffer(to, buf, data.type || "application/octet-stream");
            copied++;
          }
        } catch (e) {
          failures.push({ from, message: (e as Error).message });
        }
        const done = copied + skipped + failures.length;
        if (done % 25 === 0) console.log(`  ${done}/${plan.length}`);
      }
    }),
  );

  console.log(`\nobjects: copied ${copied}, already present ${skipped}, failed ${failures.length}`);
  for (const f of failures) console.error(`  FAIL ${f.from}: ${f.message}`);

  // Rewrite DB keys only for objects that actually landed. A key pointing at an
  // object that failed to copy is worse than one still pointing at Supabase.
  // Built from the structured field, not by splitting a formatted string on ":".
  // A colon in a key would have truncated it, the membership test would miss,
  // and the DB would be re-keyed to an object that never copied.
  const failedFrom = new Set(failures.map((f) => f.from));
  let updated = 0;
  for (const { from, to } of plan) {
    if (from === to || failedFrom.has(from)) continue;
    const [r, v] = await Promise.all([
      prisma.creativeRender.updateMany({ where: { composedImageKey: from }, data: { composedImageKey: to } }),
      prisma.creativeVersion.updateMany({ where: { composedImageKey: from }, data: { composedImageKey: to } }),
    ]);
    updated += r.count + v.count;
  }
  console.log(`db: ${updated} render/version rows re-keyed`);

  if (failures.length) process.exit(1);
}

main()
  .catch((e) => {
    console.error("migration failed:", (e as Error).message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
