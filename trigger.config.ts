import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { additionalFiles } from "@trigger.dev/build/extensions/core";
import * as Sentry from "@sentry/node";

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
  runtime: "node",
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
    ],
  },
});
