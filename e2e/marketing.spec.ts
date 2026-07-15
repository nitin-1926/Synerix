import { test, expect } from "@playwright/test";

// Marketing site is public — no auth, no AI calls.

test.describe("marketing site", () => {
  test("home page renders without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("studio product page renders", async ({ page }) => {
    await page.goto("/synerix-studio");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("consulting page renders", async ({ page }) => {
    await page.goto("/consulting");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("no em-dashes in marketing copy", async ({ page }) => {
    for (const path of ["/", "/synerix-studio", "/consulting"]) {
      await page.goto(path);
      const body = await page.locator("body").innerText();
      expect(body, `em-dash found on ${path}`).not.toContain("—");
    }
  });
});
