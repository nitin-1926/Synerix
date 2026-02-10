-- AlterTable
ALTER TABLE "credit_ledger" ALTER COLUMN "delta" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "balanceAfter" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "generation_runs" ALTER COLUMN "creditsDebited" SET DEFAULT 0,
ALTER COLUMN "creditsDebited" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "workspace_credits" ALTER COLUMN "balance" SET DEFAULT 0,
ALTER COLUMN "balance" SET DATA TYPE DECIMAL(12,2);
