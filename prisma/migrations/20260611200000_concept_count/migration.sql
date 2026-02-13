-- Per-run choice of how many distinct creative options to generate (guided runs).
-- Existing rows default to the prior fixed behaviour of 4.
ALTER TABLE "generation_runs" ADD COLUMN "conceptCount" INTEGER NOT NULL DEFAULT 4;
