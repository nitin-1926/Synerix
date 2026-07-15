import { defineConfig, devices } from "@playwright/test";

/**
 * E2E suite. Runs against the local dev server with DEV_AUTH_BYPASS=1
 * (seeded dev user/workspace — see src/lib/auth.ts). No test ever reaches a
 * paid AI call: specs cover navigation, auth gating, form validation, and
 * server-action error paths that return before any provider is invoked.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:6969",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev:next",
    url: "http://localhost:6969",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { DEV_AUTH_BYPASS: "1" },
  },
});
