import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// CLI/migrate config. The CLI uses the DIRECT (non-pooled) connection;
// the runtime client connects through the Supavisor pooler via the pg
// adapter in src/lib/db.ts.
// Next.js precedence: .env.local overrides .env (dotenv: first set wins).
config({ path: ".env.local" });
config({ path: ".env" });

type Env = {
  DIRECT_URL: string;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: env<Env>("DIRECT_URL"),
  },
});
