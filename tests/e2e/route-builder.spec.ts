import { test, expect } from "@playwright/test"
import { initStorage, ROME_LOCATION } from "./_storage"

test.describe("Построение пешего кольцевого маршрута (до 3 вариантов)", () => {
  test.beforeEach(async ({ page }) => {
    await initStorage(page, { location: ROME_LOCATION })
  })

  /**
   * Название: Из каталога можно перейти к сборке маршрута
   * Описание: Кнопка «Собрать маршрут» должна вести на страницу `/route/build`,
   * если в выдаче >= 3 POI.
   */
  test("Маршрут: переход в сборщик из каталога", async ({ page }) => {
    await page.goto("/catalog")

    const buildFromCatalog = page.getByRole("link", { name: "Собрать маршрут" })
    await expect(page.locator('a[href^="/poi/"]').first()).toBeVisible({ timeout: 30_000 })
    await expect(buildFromCatalog).toBeVisible({ timeout: 30_000 })
    // Новый UX: пользователь выбирает POI вручную.
    await page.locator("li").filter({ has: page.locator('a[href^="/poi/"]') }).locator("button").first().click()
    await page.locator("li").filter({ has: page.locator('a[href^="/poi/"]') }).locator("button").nth(1).click()
    await page.locator("li").filter({ has: page.locator('a[href^="/poi/"]') }).locator("button").nth(2).click()
    await expect(buildFromCatalog).toBeEnabled({ timeout: 30_000 })

    await buildFromCatalog.click()
    await expect(page).toHaveURL(/\/route\/build\/?$/, { timeout: 15_000 })
    await expect(page.getByRole("heading", { name: "Собрать маршрут" })).toBeVisible()
  })

  /**
   * Название: Валидация длины маршрута
   * Описание: Поле длины принимает число в диапазоне 2..50 км. При выходе за диапазон показывается ошибка.
   */
  test("Маршрут: валидация длины (2..50 км)", async ({ page }) => {
    await page.goto("/route/build")

    const len = page.locator("#len")
    await len.fill("1")
    // Валидация запускается на blur.
    await page.getByRole("heading", { name: "Собрать маршрут" }).click()

    await expect(page.getByText(/допустимый диапазон/i)).toBeVisible({ timeout: 30_000 })
    // Кнопка может оставаться enabled (валидация здесь текстовая), поэтому проверяем поведение при сабмите.
    await page.getByRole("button", { name: "Построить" }).click()
    await expect(page).toHaveURL(/\/route\/build/)
  })

  /**
   * Название: Построение отдаёт 1..3 уникальных варианта
   * Описание: После клика «Построить» открывается `/route/results` и отображается до 3 вариантов.
   * Все показанные варианты должны отличаться составом/порядком остановок.
   */
  test("Маршрут: строится и показывает уникальные варианты", async ({ page }) => {
    await page.goto("/route/build")

    // Чтобы избежать флейков из-за геолокации, выбираем старт от центра области.
    await expect(page.getByLabel("Центр выбранной области")).toBeVisible({ timeout: 30_000 })
    await page.getByLabel("Центр выбранной области").click()

    await page.locator("#len").fill("10")
    await expect(page.getByRole("button", { name: "Построить" })).toBeEnabled({ timeout: 30_000 })
    await page.getByRole("button", { name: "Построить" }).click()

    await expect(page).toHaveURL(/\/route\/results\/?$/, { timeout: 30_000 })
    await expect(page.getByRole("heading", { name: "Варианты маршрута" })).toBeVisible({ timeout: 30_000 })

    const variantCards = page.locator('main ul > li')
    const n = await variantCards.count()
    expect(n).toBeGreaterThan(0)
    expect(n).toBeLessThanOrEqual(3)

    const signatures = new Set<string>()
    for (let i = 0; i < n; i++) {
      const titles = await variantCards
        .nth(i)
        .locator("ol li span.font-medium")
        .allTextContents()
      const sig = titles.map((t) => t.trim()).join(">")
      expect(sig).not.toEqual("")
      expect(signatures.has(sig)).toBeFalsy()
      signatures.add(sig)
    }
  })
})

