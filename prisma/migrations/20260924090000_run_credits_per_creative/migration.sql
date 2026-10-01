-- Unit price of one delivered creative, frozen when the run is debited, so
-- every refund path prices undelivered work identically.
ALTER TABLE "generation_runs" ADD COLUMN "creditsPerCreative" DECIMAL(12,2);
