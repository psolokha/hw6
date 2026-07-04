import { test, expect } from "@playwright/test";

function getSupabaseAuthStorageKey(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co";
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

/**
 * Название: Главная страница открывается
 * Описание: Базовая проверка доступности приложения и заголовка/первого экрана.
 */
test("Главная: открывается и содержит CTA планировщика", async ({ page }) => {
  await page.goto("/");

  // Поскольку это маркетинговая страница, фиксируемся на стабильном тексте CTA.
  await expect(page.getByRole("link", { name: "Построить маршрут" })).toBeVisible();
});

test("Главная: кнопка профиля ведёт на страницу авторизации", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Войти" }).click();

  await expect(page).toHaveURL(/\/auth\?next=%2F$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("Главная: авторизованный пользователь видит кнопку выхода", async ({ page }) => {
  const storageKey = getSupabaseAuthStorageKey();

  await page.addInitScript(
    ({ key }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          access_token: "mock-home-access-token",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: "mock-home-refresh-token",
          user: {
            id: "home-user-id",
            aud: "authenticated",
            role: "authenticated",
            email: "home-user@example.com",
            app_metadata: { provider: "email", providers: ["email"] },
            user_metadata: { email: "home-user@example.com" },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      );
    },
    { key: storageKey },
  );

  await page.goto("/");

  await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible();
});
