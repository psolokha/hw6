import { test, expect } from "@playwright/test";
import { initStorage, ROME_LOCATION } from "./_storage";

const oauthEmail = "oauth-user@example.com";
const oauthAccessToken = "mock-oauth-access-token";
const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:4000").replace(
  /\/$/,
  "",
);

test.describe("OAuth2 UI", () => {
  test.beforeEach(async ({ page }) => {
    await initStorage(page, { location: ROME_LOCATION });
  });

  test("В диалоге входа отображается кнопка Google OAuth", async ({ page }) => {
    await page.goto("/catalog");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByRole("button", { name: "Войти через Google" })).toBeVisible();
  });

  test("OAuth callback сохраняет frontend-сессию и Bearer JWT работает с /api/auth/me", async ({
    page,
  }) => {
    await page.route("**/auth/v1/authorize**", async (route) => {
      const url = new URL(route.request().url());
      expect(url.searchParams.get("provider")).toBe("google");
      expect(url.searchParams.get("redirect_to")).toContain("/auth/callback");

      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><title>Mock OAuth provider</title>",
      });
    });

    await page.route("**/auth/v1/token?grant_type=pkce", async (route) => {
      const body = route.request().postData() ?? "";
      expect(body).toContain("mock-oauth-code");
      expect(body).toContain("code_verifier");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: oauthAccessToken,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: "mock-oauth-refresh-token",
          user: {
            id: "oauth-user-id",
            aud: "authenticated",
            role: "authenticated",
            email: oauthEmail,
            app_metadata: { provider: "google", providers: ["google"] },
            user_metadata: { email: oauthEmail },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      });
    });

    await page.route(`${backendUrl}/api/auth/me`, async (route) => {
      expect(route.request().headers().authorization).toBe(`Bearer ${oauthAccessToken}`);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "oauth-user-id",
          email: oauthEmail,
          provider: "google",
        }),
      });
    });

    await page.goto("/catalog");
    await page.getByRole("button", { name: "Войти" }).click();
    await page.getByRole("button", { name: "Войти через Google" }).click();
    await expect(page).toHaveURL(/\/auth\/v1\/authorize/);

    await page.goto("/auth/callback?code=mock-oauth-code&next=/catalog");

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible({ timeout: 15_000 });

    const profile = await page.evaluate(
      async ({ token, url }) => {
        const res = await fetch(`${url}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.json();
      },
      { token: oauthAccessToken, url: backendUrl },
    );

    expect(profile).toMatchObject({
      email: oauthEmail,
      provider: "google",
    });
  });
});
