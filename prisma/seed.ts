import { config } from "dotenv";
// Next.js precedence: .env.local overrides .env (dotenv: first set wins).
config({ path: ".env.local" });
config({ path: ".env" });

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type FestivalCategory } from "../src/generated/prisma/client";

interface FixtureOccurrence {
  year: number;
  date: string;
  endDate?: string;
  isApproximate: boolean;
}
interface FixtureFestival {
  slug: string;
  name: string;
  nameHindi?: string;
  category: FestivalCategory;
  regionTags: string[];
  relevanceTags: string[];
  creativeContext: unknown;
  defaultLeadTimeDays: number;
  occurrences: FixtureOccurrence[];
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const fixture: FixtureFestival[] = JSON.parse(
    readFileSync(join(__dirname, "../src/data/festivals/festivals.json"), "utf8"),
  );

  for (const f of fixture) {
    const festival = await prisma.festival.upsert({
      where: { slug: f.slug },
      create: {
        slug: f.slug,
        name: f.name,
        nameHindi: f.nameHindi ?? null,
        category: f.category,
        regionTags: f.regionTags,
        relevanceTags: f.relevanceTags,
        creativeContext: f.creativeContext as object,
        defaultLeadTimeDays: f.defaultLeadTimeDays,
      },
      update: {
        name: f.name,
        nameHindi: f.nameHindi ?? null,
        category: f.category,
        regionTags: f.regionTags,
        relevanceTags: f.relevanceTags,
        creativeContext: f.creativeContext as object,
        defaultLeadTimeDays: f.defaultLeadTimeDays,
      },
    });
    for (const o of f.occurrences) {
      await prisma.festivalOccurrence.upsert({
        where: { festivalId_year: { festivalId: festival.id, year: o.year } },
        create: {
          festivalId: festival.id,
          year: o.year,
          date: new Date(o.date),
          endDate: o.endDate ? new Date(o.endDate) : null,
          isApproximate: o.isApproximate,
        },
        update: {
          date: new Date(o.date),
          endDate: o.endDate ? new Date(o.endDate) : null,
          isApproximate: o.isApproximate,
        },
      });
    }
  }

  const counts = await prisma.$transaction([
    prisma.festival.count(),
    prisma.festivalOccurrence.count(),
  ]);
  console.log(`Seeded ${counts[0]} festivals, ${counts[1]} occurrences`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
