import { test, expect } from "@playwright/test";
import { initStorage, ROME_LOCATION } from "./_storage";

test.describe("Избранное (объекты/маршруты)", () => {
  test.beforeEach(async ({ page }) => {
    await initStorage(page, { location: ROME_LOCATION });
  });

  /**
   * Название: Пустое избранное показывает empty-state
   * Описание: При отсутствии сохранённых элементов страница `/favorites` предлагает перейти в каталог.
   */
  test("Избранное: empty-state и переход в каталог", async ({ page }) => {
    await page.goto("/favorites");

    await expect(page.getByRole("heading", { name: "Избранное" })).toBeVisible();
    await expect(page.getByText(/пока пусто/i)).toBeVisible();

    await page.getByRole("link", { name: "Перейти в каталог" }).click();
    await expect(page).toHaveURL(/\/catalog\/?$/);
  });

  /**
   * Название: Добавленный POI появляется в избранном и открывается
   * Описание: Сохраняем объект на странице POI и убеждаемся, что он отображается в избранном
   * и ведёт обратно на корректную карточку.
   */
  test("Избранное: POI сохраняется и открывается", async ({ page }) => {
    await page.goto("/poi/poi-rome-colosseum");
    await page.getByRole("button", { name: "В избранное" }).click({ timeout: 30_000 });

    await page.goto("/favorites");
    await expect(page.getByRole("link", { name: "Колизей" })).toBeVisible();

    await page.getByRole("link", { name: "Открыть" }).click();
    await expect(page).toHaveURL(/\/poi\/poi-rome-colosseum\/?$/);
  });

  /**
   * Название: Сохранённый маршрут появляется в избранном и удаляется
   * Описание: Строим варианты маршрута, сохраняем один вариант и проверяем:
   * 1) он появился в `/favorites` во вкладке «Маршруты»
   * 2) кнопку удаления можно использовать для удаления элемента.
   */
  test("Избранное: маршрут сохраняется и удаляется", async ({ page }) => {
    await page.goto("/route/build");

    // Старт — от центра области, чтобы не зависеть от геолокации.
    await expect(page.getByLabel("Центр выбранной области")).toBeVisible({ timeout: 30_000 });
    await page.getByLabel("Центр выбранной области").click();
    await page.locator("#len").fill("10");
    await expect(page.getByRole("button", { name: "Построить" })).toBeEnabled({ timeout: 30_000 });
    await page.getByRole("button", { name: "Построить" }).click();

    await expect(page).toHaveURL(/\/route\/results\/?$/, { timeout: 30_000 });

    // Сохраняем первый вариант маршрута.
    await page.getByRole("button", { name: "В избранное" }).first().click();

    await page.goto("/favorites");
    await page.getByRole("button", { name: "Маршруты" }).click();

    // Должен появиться хотя бы один элемент типа “Маршрут” (бэйдж внутри карточки).
    await expect(page.getByRole("main").getByText("Маршрут", { exact: true })).toBeVisible();

    // Удаляем (иконка с aria-label="Удалить").
    await page.getByLabel("Удалить").first().click();

    // После удаления список может стать пустым и показать empty-state.
    await expect(page.getByText(/пока пусто/i)).toBeVisible();
  });
});
