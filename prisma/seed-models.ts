import { config } from "dotenv";
// Next.js precedence: .env.local overrides .env (dotenv: first set wins).
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { generateImageGemini } from "../src/lib/image/gemini";
import { uploadBuffer, storageKeys, ensureMediaBucket } from "../src/lib/storage";
import { MODEL_PRESETS } from "../src/data/models/presets";

/**
 * Seed the shared global AI-model preset library. Idempotent: a preset that
 * already exists READY with a stored image is skipped. Generates one reference
 * photo per preset via Nano Banana Pro. Run once per environment:
 *   npx tsx prisma/seed-models.ts
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  await ensureMediaBucket();
  // SEED_FORCE=1 regenerates the library: prune existing GLOBAL presets first so
  // renamed/recast presets replace the old set instead of duplicating it.
  if (process.env.SEED_FORCE) {
    const { count } = await prisma.aiModel.deleteMany({ where: { scope: "GLOBAL" } });
    console.log(`SEED_FORCE: pruned ${count} existing global presets`);
  }
  let created = 0;
  let skipped = 0;

  for (const preset of MODEL_PRESETS) {
    const existing = await prisma.aiModel.findFirst({
      where: { scope: "GLOBAL", name: preset.name },
    });
    // SEED_FORCE=1 regenerates existing presets (e.g. after a casting upgrade).
    if (existing?.storageKey && existing.status === "READY" && !process.env.SEED_FORCE) {
      skipped += 1;
      continue;
    }

    console.log(`Generating preset: ${preset.name}`);
    const buffer = await generateImageGemini({ prompt: preset.prompt, aspect: "4:5" });
    const key = storageKeys.aiModelPreset(preset.slug);
    await uploadBuffer(key, buffer, "image/png");

    const data = {
      scope: "GLOBAL" as const,
      name: preset.name,
      description: preset.description,
      traits: preset.traits,
      storageKey: key,
      mimeType: "image/png",
      status: "READY" as const,
    };
    if (existing) await prisma.aiModel.update({ where: { id: existing.id }, data });
    else await prisma.aiModel.create({ data });
    created += 1;
  }

  console.log(`Model presets — created/updated ${created}, skipped ${skipped}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
