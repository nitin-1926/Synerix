import { test, expect, type Page } from "@playwright/test";

/**
 * Real end-to-end generation through the live pipeline (paid API calls).
 * Opt-in only: set E2E_REAL_GENERATION=1 (the PR e2e workflow does). Runs in
 * the seeded "E2E Tests" workspace (scripts/seed-e2e-workspace.ts) against the
 * cheap-model env (Haiku LLM slots + Nano Banana 2, see .github/workflows/e2e.yml)
 * and needs the Trigger dev worker running alongside next dev (`npm run dev`).
 */
const REAL = process.env.E2E_REAL_GENERATION === "1";

test.describe("real generation (E2E Tests workspace)", () => {
  test.skip(!REAL, "set E2E_REAL_GENERATION=1 to run the paid generation e2e");
  // One generation at a time — parallel runs would race the workspace credits
  // and double the CI bill for no signal.
  test.describe.configure({ mode: "serial" });
  test.setTimeout(420_000);

  // The seeded workspace (slug "e2e-tests") is permanent in the shared DB, so
  // its id is stable. Override only if the workspace was ever reseeded fresh.
  // (No prisma import here: Playwright's transpiler can't resolve the "@/"
  // alias inside transitively-imported app modules like src/lib/db.ts.)
  const wsId = process.env.E2E_WORKSPACE_ID ?? "a15a9e76-72e4-4273-a664-0fddf40c74c0";

  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([
      // Dev-bypass user is a super-admin: unlock the workspace view and pin
      // the active workspace to E2E Tests (see src/lib/auth.ts cookies).
      { name: "sx-admin-acting", value: "1", url: baseURL! },
      { name: "sx-active-ws", value: wsId, url: baseURL! },
    ]);
  });

  async function expectRunCompletes(page: Page) {
    await expect(page).toHaveURL(/\/studio\/[0-9a-f-]{36}/, { timeout: 60_000 });
    // A finished option surfaces as a thumbnail in the left rail (composed
    // render uploaded + creative READY). A failed run renders the destructive
    // panel instead — assert both directions.
    const thumb = page.locator('a[href*="?c="] img').first();
    await expect(thumb).toBeVisible({ timeout: 360_000 });
    await expect(page.getByText("This run failed")).toHaveCount(0);
  }

  test("product campaign (in-scene) generates a creative", async ({ page }) => {
    await page.goto("/studio");
    // The seeded product is apparel, so it defaults to on-model; switch to the
    // in-scene campaign mode (which exposes the option-count picker).
    await page.getByRole("button", { name: /^In-scene / }).click();
    await page.getByRole("button", { name: "1 option · 2 cr" }).click();
    await page.getByRole("button", { name: /^Generate 1 option$/ }).click();
    await expectRunCompletes(page);
  });

  test("on-model plain e-commerce shot generates a creative", async ({ page }) => {
    await page.goto("/studio");
    // Mode cards render as buttons "«title» «description»" — plain text
    // selectors are ambiguous against the summary rail's value cells.
    await page.getByRole("button", { name: /^On-model / }).click();
    await page.getByRole("button", { name: /^Plain image / }).click();
    // On-model has no "how many options" picker — poses drive the count. Pick
    // one pose → one image of the model + garment in that pose.
    await page.getByRole("button", { name: "Standing" }).click();
    await page.getByRole("button", { name: /^Generate 1 option$/ }).click();
    await expectRunCompletes(page);
  });
});
