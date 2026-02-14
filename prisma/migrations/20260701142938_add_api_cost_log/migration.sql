-- CreateEnum
CREATE TYPE "ApiCostKind" AS ENUM ('LLM', 'IMAGE');

-- CreateTable
CREATE TABLE "api_cost_log" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "runId" TEXT,
    "source" TEXT NOT NULL,
    "kind" "ApiCostKind" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "usd" DECIMAL(12,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_cost_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_cost_log_workspaceId_createdAt_idx" ON "api_cost_log"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "api_cost_log_runId_idx" ON "api_cost_log"("runId");

-- CreateIndex
CREATE INDEX "api_cost_log_createdAt_idx" ON "api_cost_log"("createdAt");
