import { test, expect } from "@playwright/test"
import { initStorage, ROME_LOCATION } from "./_storage"

test.describe("Карточка достопримечательности + карты + медиа", () => {
  test.beforeEach(async ({ page }) => {
    await initStorage(page, { location: ROME_LOCATION })
  })

  /**
   * Название: Страница POI отображает базовые данные
   * Описание: Проверяем, что по прямому URL POI видны название и координаты (формат с 6 знаками).
   */
  test("POI: отображаются название и координаты", async ({ page }) => {
    await page.goto("/poi/poi-rome-colosseum")

    await expect(page.getByRole("heading", { name: "Колизей" })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/41\.890200,\s*12\.492200/)).toBeVisible({ timeout: 30_000 })
  })

  /**
   * Название: «Открыть в картах» открывает новую вкладку
   * Описание: Клик по кнопке должен сделать `window.open()` и открыть URL Яндекс.Карт с параметром `pt=lng,lat`.
   */
  test("POI: открытие в картах работает (popup)", async ({ page }) => {
    await page.goto("/poi/poi-rome-colosseum")

    // Не открываем реальный Яндекс (он может требовать капчу/редиректить).
    // Вместо этого проверяем, что приложение формирует корректный URL в `window.open(...)`.
    const opened: string[] = []
    await page.addInitScript(() => {
      ;(window as any).__openedUrls = []
      const orig = window.open
      window.open = function (url?: string | URL) {
        try {
          ;(window as any).__openedUrls.push(String(url ?? ""))
        } catch {}
        // Не открываем внешнюю вкладку в e2e.
        return null as any
      } as any
      ;(window as any).__restoreOpen = () => {
        window.open = orig
      }
    })

    await page.reload()
    await page.getByRole("button", { name: "Открыть в картах" }).click({ timeout: 30_000 })

    const urls = await page.evaluate(() => (window as any).__openedUrls as string[])
    expect(urls.length).toBeGreaterThan(0)
    const url = urls[urls.length - 1]
    // `openInMaps()` формирует `pt=${lng},${lat}`.
    expect(url).toMatch(/yandex\.(ru|com)\/maps/)
    expect(url).toMatch(/pt=12\.4922,41\.8902/)
  })
})

