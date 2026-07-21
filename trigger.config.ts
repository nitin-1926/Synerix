import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { additionalFiles, syncEnvVars } from "@trigger.dev/build/extensions/core";
import * as Sentry from "@sentry/node";
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
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "OPENAI_API_KEY",
  "RUNWARE_API_KEY",
  "FIRECRAWL_API_KEY",
  "FAL_KEY",
  "SENTRY_DSN",
];

// Error monitoring for task workers. No-op until SENTRY_DSN is set.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0,
  });
}

export default defineConfig({
  project: "proj_gtjzmmmwfafgaloqpzgf",
  // node-22 (not "node" → Node 21): the worker's own realtime coordination
  // client needs a native global WebSocket, absent before Node 22. On "node"
  // every deployed run dies with "Node.js 21 detected without native WebSocket
  // support" the moment it executes (local dev survived on the host's Node 22).
  runtime: "node-22",
  logLevel: "log",
  maxDuration: 3600,
  onFailure: async ({ payload, error, ctx }) => {
    if (!process.env.SENTRY_DSN) return;
    Sentry.captureException(error, {
      extra: { taskId: ctx.task.id, runId: ctx.run.id, payload },
    });
    await Sentry.flush(2_000);
  },
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
