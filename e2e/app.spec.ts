import { test, expect } from "@playwright/test";

// Authenticated app under DEV_AUTH_BYPASS=1 (seeded dev user/workspace).
// The dev user is a super-admin, so bare app routes redirect to /admin;
// the sx-admin-acting=1 cookie (set by the real "enter workspace" action)
// unlocks the workspace view. None of these specs trigger a generation run
// or any paid provider call.

test.describe("admin console (super-admin default view)", () => {
  test("app routes redirect the super-admin to /admin", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/admin/);
    await expect(page).toHaveTitle(/Admin/);
  });
});

test.describe("workspace app shell", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([
      { name: "sx-admin-acting", value: "1", url: baseURL! },
    ]);
  });

  test("dashboard loads for the dev user", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveTitle(/Dashboard/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("studio create page renders the form", async ({ page }) => {
    await page.goto("/studio");
    await expect(page).toHaveTitle(/Create/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("library page loads", async ({ page }) => {
    await page.goto("/library");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("models page loads", async ({ page }) => {
    await page.goto("/models");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("calendar page loads", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
