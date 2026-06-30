import { test, expect } from "@playwright/test";
import { initStorage, ROME_LOCATION } from "./_storage";

test.describe("Регрессия интеграций (шаг 8)", () => {
  test("CI/CD smoke: health backend + frontend + categories", async ({ request }) => {
    const backendHealth = await request.get("http://127.0.0.1:4000/api/health");
    expect(backendHealth.ok()).toBeTruthy();
    const backendBody = await backendHealth.json();
    expect(backendBody.ok).toBe(true);

    const frontendHealth = await request.get("/api/health");
    expect(frontendHealth.ok()).toBeTruthy();
    const frontendBody = await frontendHealth.json();
    expect(frontendBody.ok).toBe(true);
    expect(frontendBody.checks.backend.status).toBe("ok");

    const categories = await request.get("http://127.0.0.1:4000/api/categories");
    expect(categories.ok()).toBeTruthy();
    const cacheControl = categories.headers()["cache-control"] ?? "";
    expect(cacheControl).toMatch(/max-age=\d+/);
    const list = await categories.json();
    expect(list.length).toBeGreaterThan(0);
  });

  test("OAuth2: кнопка Google в диалоге входа", async ({ page }) => {
    await initStorage(page, { location: ROME_LOCATION });
    await page.goto("/catalog");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByRole("button", { name: "Войти через Google" })).toBeVisible();
  });

  test("Аналитика: страницы открываются без ошибок (Метрика опциональна)", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await initStorage(page, { location: ROME_LOCATION });

    await page.goto("/");
    await expect(page.getByRole("link", { name: /каталог|планировщик/i }).first()).toBeVisible();

    await page.goto("/catalog");
    await expect(page).toHaveURL(/\/catalog/);

    const ymCounterId = process.env.NEXT_PUBLIC_YM_COUNTER_ID?.trim();
    if (ymCounterId) {
      await expect(page.locator("#yandex-metrika")).toBeAttached();
    }

    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes("Missing `Description`") && !e.includes("aria-describedby"),
    );
    expect(criticalErrors).toEqual([]);
  });

  test("Платежи: шаг пропущен — нет UI оплаты", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/оплат|payment|checkout/i)).toHaveCount(0);
  });
});
