-- Fingerprint device identification on Business Health Check submissions.
--
-- Both nullable: identification is best-effort (ad blockers stop the agent),
-- so NULL means "unattributed lead", never "invalid lead". The index on
-- visitorId is the reason this exists at all — it makes "one device, many
-- leads under different emails" a query instead of a hunch.

ALTER TABLE "test_results" ADD COLUMN "visitorId" TEXT;
ALTER TABLE "test_results" ADD COLUMN "fingerprintEventId" TEXT;

CREATE INDEX "test_results_visitorId_idx" ON "test_results"("visitorId");
