-- Cloudflare R2 migration: record who triggered a run, and freeze each
-- creative's object prefix.
--
-- storagePrefix is {workspace.slug}/{createdByUserId}/{unix seconds}. It is
-- frozen at creation because R2 has no cheap server-side move: renaming a
-- workspace must not orphan objects already written under the old name. The
-- prefix records where the bytes ARE, not what the workspace is called today.

ALTER TABLE "generation_runs" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "creatives" ADD COLUMN "storagePrefix" TEXT;

-- Backfill: the real creator of an existing run is unrecoverable (it was never
-- captured), so attribute those to the workspace owner.
UPDATE "generation_runs" r
   SET "createdByUserId" = w."ownerUserId"
  FROM "workspaces" w
 WHERE w.id = r."workspaceId"
   AND r."createdByUserId" IS NULL;

-- Backfill the prefix for every existing creative from its run + workspace.
-- extract(epoch) is truncated to whole seconds to match the runtime format.
UPDATE "creatives" c
   SET "storagePrefix" =
         w.slug || '/' || COALESCE(r."createdByUserId", w."ownerUserId") || '/'
         || floor(extract(epoch from c."createdAt"))::bigint::text
  FROM "generation_runs" r
  JOIN "workspaces" w ON w.id = r."workspaceId"
 WHERE r.id = c."generationRunId"
   AND c."storagePrefix" IS NULL;
