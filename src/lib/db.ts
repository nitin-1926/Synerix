import { PrismaPg } from "@prisma/adapter-pg";
import type { PoolConfig } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

// Runtime connects via the Supavisor transaction pooler (DATABASE_URL :6543,
// pgbouncer=true&connection_limit=1). Migrations use DIRECT_URL (see prisma.config.ts).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function parseDatabaseUrl(connectionString: string): PoolConfig {
  const url = new URL(connectionString.replace(/^postgresql:/, "http:"));
  const usePooler = url.searchParams.get("pgbouncer") === "true";

  return {
    host: url.hostname,
    port: Number(url.port) || 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, "") || "postgres",
    ssl: { rejectUnauthorized: false },
    // Supavisor transaction mode multiplexes many short client connections, so
    // a small local pool is safe — max: 1 serialized every parallel query.
    max: usePooler ? 5 : undefined,
  };
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaPg(parseDatabaseUrl(connectionString));
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
