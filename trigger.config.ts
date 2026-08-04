import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { additionalFiles, syncEnvVars } from "@trigger.dev/build/extensions/core";
import { config as loadEnv } from "dotenv";

// Deploy-time env for the config itself (the worker gets its env from the
// Trigger.dev dashboard, kept in sync by the syncEnvVars extension below).
loadEnv({ path: ".env" });

/**
 * Everything the tasks read at runtime. Synced to the Trigger.dev project env
 * on every deploy — but ONLY vars that are non-empty locally, so a CI deploy
 * without these secrets never blanks the dashboard values. Deliberately
 * excludes app-only vars (AUTH_*, GMAIL_*, DEV_AUTH_BYPASS).
 */
const WORKER_ENV_VARS = [
  "DATABASE_URL",
  "DIRECT_URL",
  // Object storage is Cloudflare R2, not Supabase. Missing these does not
  // degrade the worker — it kills it: the FIRST thing generation-run does is
  // downloadFromStorage() for the product reference, and src/lib/storage.ts
  // throws outright when the credentials are absent. The old Supabase entries
  // were left here after the R2 migration, so a deploy to any environment
  // without hand-entered R2 vars would have failed 100% of image work.
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "ANTHROPIC_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "OPENAI_API_KEY",
  "RUNWARE_API_KEY",
  "FIRECRAWL_API_KEY",
  "FAL_KEY",
];


export default defineConfig({
  project: "proj_gtjzmmmwfafgaloqpzgf",
  // node-22 (not "node" → Node 21): the worker's own realtime coordination
  // client needs a native global WebSocket, absent before Node 22. On "node"
  // every deployed run dies with "Node.js 21 detected without native WebSocket
  // support" the moment it executes (local dev survived on the host's Node 22).
  runtime: "node-22",
  logLevel: "log",
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
  build: {
    // @napi-rs/canvas ships native binaries — must not be bundled.
    external: ["@napi-rs/canvas"],
    extensions: [
      // Modern mode: Prisma 7 + prisma-client provider + pg adapter.
      prismaExtension({ mode: "modern" }),
      // The canvas compositor loads fonts from public/fonts at runtime.
      additionalFiles({ files: ["./public/fonts/**"] }),
      // Push worker env vars to the Trigger.dev project on deploy (see list above).
      syncEnvVars(() =>
        WORKER_ENV_VARS.filter((name) => process.env[name]).map((name) => ({
          name,
          value: process.env[name]!,
        })),
      ),
    ],
  },
});
