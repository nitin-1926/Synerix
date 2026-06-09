import * as Sentry from "@sentry/nextjs";

// Server/edge error monitoring. No-op until SENTRY_DSN is set — safe to ship
// before the Sentry project exists.
export async function register() {
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

export const onRequestError = Sentry.captureRequestError;
