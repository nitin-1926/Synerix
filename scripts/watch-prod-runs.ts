/**
 * Live watcher: reports new production generation runs and their status
 * transitions. Used to verify the generate button end-to-end right after a
 * deploy (run with `npx tsx scripts/watch-prod-runs.ts`, Ctrl-C to stop).
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const since = new Date();
const seen = new Map<string, string>();

async function main() {
  const { prisma } = await import("../src/lib/db");
  console.log(`watching generation_runs created after ${since.toISOString()}`);
  for (;;) {
    try {
      const rows = await prisma.generationRun.findMany({
        where: { createdAt: { gt: since } },
        orderBy: { createdAt: "asc" },
        select: { id: true, status: true, triggerRunId: true, error: true, createdAt: true },
      });
      for (const r of rows) {
        const prev = seen.get(r.id);
        if (prev !== r.status) {
          seen.set(r.id, r.status);
          const bits = [`run ${r.id.slice(0, 8)}`, `status=${r.status}`];
          if (!prev) bits.push("NEW");
          if (r.triggerRunId) bits.push(`trigger=${r.triggerRunId}`);
          if (r.error) bits.push(`error=${String(r.error).slice(0, 160)}`);
          console.log(bits.join(" | "));
        }
      }
    } catch (e) {
      console.error("poll error:", (e as Error).message);
    }
    await new Promise((res) => setTimeout(res, 20_000));
  }
}

main();
