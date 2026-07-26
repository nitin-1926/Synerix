-- Creative.generationRunId had no index: PostgreSQL does not get one implicitly
-- for a relation scalar, and the studio page, the library and every refund path
-- filter creatives by run. Small table today, sequential scan forever otherwise.
CREATE INDEX IF NOT EXISTS "creatives_generationRunId_idx" ON "creatives"("generationRunId");
