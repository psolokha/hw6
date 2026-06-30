import { test, expect } from "@playwright/test";
import { initStorage, ROME_LOCATION } from "./_storage";

test.describe("OAuth2 UI", () => {
  test.beforeEach(async ({ page }) => {
    await initStorage(page, { location: ROME_LOCATION });
  });

  test("В диалоге входа отображается кнопка Google OAuth", async ({ page }) => {
    await page.goto("/catalog");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByRole("button", { name: "Войти через Google" })).toBeVisible();
  });
});
