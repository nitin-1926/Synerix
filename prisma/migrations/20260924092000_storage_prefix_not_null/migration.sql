-- Both were nullable only for rows predating the R2 migration; the backfills in
-- 20260731060000_r2_storage_prefix covered every row (verified 0 NULLs before
-- this migration). A NULL here would now fail the ALTER rather than be guessed.
ALTER TABLE "generation_runs" ALTER COLUMN "createdByUserId" SET NOT NULL;
ALTER TABLE "creatives" ALTER COLUMN "storagePrefix" SET NOT NULL;

-- _prisma_migrations lives in `public` and is created by `migrate deploy`, so no
-- earlier RLS migration covered it; on a fresh project it would be readable and
-- writable over the Data API with the anon key. Idempotent where it is already on.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
