/**
 * One-off migration: copy the legacy Pinata website data (business-health
 * Test + TestResult rows) from the old Neon Postgres into the unified
 * Supabase Postgres. Table names and cuid IDs are preserved 1:1, so the
 * copy is idempotent (skipDuplicates).
 *
 * Run:  npx tsx scripts/migrate-legacy-pinata.ts
 * Env:  LEGACY_PINATA_DATABASE_URL (old Neon url, in .env.local)
 *       DATABASE_URL               (Supabase, in .env.local)
 */
import "dotenv/config";
import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";

async function main() {
  const legacyUrl = process.env.LEGACY_PINATA_DATABASE_URL;
  if (!legacyUrl) throw new Error("LEGACY_PINATA_DATABASE_URL is not set");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const legacy = new Client({ connectionString: legacyUrl });
  await legacy.connect();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    // ---- tests ----
    const tests = await legacy.query(
      `SELECT id, name, type, description, questions, "isActive", "createdAt", "updatedAt" FROM tests`,
    );
    console.log(`legacy tests: ${tests.rowCount}`);
    if (tests.rowCount) {
      const res = await prisma.test.createMany({
        data: tests.rows.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          description: r.description,
          questions: r.questions as Prisma.InputJsonValue,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        skipDuplicates: true,
      });
      console.log(`  inserted: ${res.count} (rest already present)`);
    }

    // ---- test_results ----
    const results = await legacy.query(
      `SELECT id, "testId", "phoneNumber", email, name, "businessName", "businessDescription",
              "testScore", answers, "categoryAnalysis", recommendations, "createdAt", "updatedAt"
       FROM test_results`,
    );
    console.log(`legacy test_results: ${results.rowCount}`);
    if (results.rowCount) {
      const res = await prisma.testResult.createMany({
        data: results.rows.map((r) => ({
          id: r.id,
          testId: r.testId,
          phoneNumber: r.phoneNumber,
          email: r.email,
          name: r.name,
          businessName: r.businessName,
          businessDescription: r.businessDescription,
          testScore: r.testScore,
          answers: r.answers as Prisma.InputJsonValue,
          categoryAnalysis: r.categoryAnalysis as Prisma.InputJsonValue,
          recommendations: r.recommendations as Prisma.InputJsonValue,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        skipDuplicates: true,
      });
      console.log(`  inserted: ${res.count} (rest already present)`);
    }

    const [testCount, resultCount] = await Promise.all([
      prisma.test.count(),
      prisma.testResult.count(),
    ]);
    console.log(`done — supabase now has ${testCount} tests, ${resultCount} test_results`);
  } finally {
    await legacy.end();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
