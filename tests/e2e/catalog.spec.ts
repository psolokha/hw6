import { test, expect } from "@playwright/test";
import { initStorage, ROME_LOCATION } from "./_storage";

test.describe("Каталог по локации + фильтры категорий", () => {
  test.beforeEach(async ({ page }) => {
    await initStorage(page, { location: ROME_LOCATION });
  });

  /**
   * Название: Каталог открывается для выбранной локации
   * Описание: При наличии локации в `localStorage` страница `GET /catalog` не редиректит на `/location`
   * и показывает заголовок и выбранную область.
   */
  test("Каталог: открывается и показывает выбранную локацию", async ({ page }) => {
    await page.goto("/catalog");

    await expect(page.getByRole("heading", { name: "Каталог" })).toBeVisible({ timeout: 30_000 });
    // В UI “Рим” отображается и в индикаторе локации, и в подзаголовке страницы.
    // Чтобы избежать strict-mode конфликтов — фиксируемся на link в индикаторе.
    await expect(page.getByRole("link", { name: "Рим", exact: true }).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  /**
   * Название: Фильтр по категории сужает выдачу
   * Описание: При выборе категории список карточек меняется (минимально — становится не больше исходного),
   * и появляется кнопка «Сбросить».
   */
  test("Каталог: фильтр по категории работает", async ({ page }) => {
    await page.goto("/catalog");

    const cards = page.locator('a[href^="/poi/"]');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });

    const before = await cards.count();

    // Выбираем категорию, которая точно есть в моках.
    // Важно: слово «Музей» встречается и в карточках, поэтому кликаем именно по фильтру в строке «Категории».
    const categoriesRow = page.getByText("Категории:", { exact: true }).locator("..");
    const museum = categoriesRow.getByText("Музей", { exact: true });
    await expect(museum).toBeVisible({ timeout: 30_000 });
    await museum.click();

    await expect(page.getByRole("button", { name: "Сбросить" })).toBeVisible();

    const after = await cards.count();
    // Фильтр не должен увеличивать выдачу.
    expect(after).toBeLessThanOrEqual(before);
  });

  /**
   * Название: При недостаточном количестве точек маршрут недоступен
   * Описание: Для построения маршрута нужно минимум 3 POI. Если фильтр оставляет <3,
   * кнопка «Собрать маршрут» заблокирована и показывается подсказка.
   */
  test("Каталог: нельзя собрать маршрут при <3 точках", async ({ page }) => {
    await page.goto("/catalog");

    // Категория «Музей» для Рима даёт 2 POI (Ватикан и Замок Св. Ангела) — это удобно для проверки.
    // Важно: слово «Музей» встречается и в карточках, поэтому кликаем именно по фильтру в строке «Категории».
    const categoriesRow = page.getByText("Категории:", { exact: true }).locator("..");
    const museum = categoriesRow.getByText("Музей", { exact: true });
    await expect(museum).toBeVisible({ timeout: 30_000 });
    await museum.click();

    await expect(page.getByRole("button", { name: "Сбросить" })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('a[href^="/poi/"]')).toHaveCount(2, { timeout: 15_000 });

    const buildBtn = page.getByRole("link", { name: "Собрать маршрут" });
    await expect(buildBtn).toHaveAttribute("disabled", "", { timeout: 15_000 });

    await expect(page.getByText(/выберите не менее трёх/i)).toBeVisible({ timeout: 15_000 });
  });
});
