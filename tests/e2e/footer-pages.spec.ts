import { test, expect } from "@playwright/test"

test.describe("Страницы из футера", () => {
  /**
   * Название: Все страницы из футера открываются
   * Описание: Проверяем, что основные страницы, доступные из футера главной, открываются и показывают H1.
   */
  test("Футер: ссылки ведут на существующие страницы", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 })

    // На главной в футере есть ссылки на эти страницы.
    const footerLinks = [
      { name: "О проекте", path: "/about", h1: "О проекте" },
      { name: "Блог", path: "/blog", h1: "Блог" },
      { name: "Вакансии", path: "/careers", h1: "Вакансии" },
      { name: "Контакты", path: "/contacts", h1: "Контакты" },
      { name: "Конфиденциальность", path: "/privacy", h1: "Конфиденциальность" },
    ] as const

    for (const l of footerLinks) {
      // Кликаем именно по ссылке (а не прямой переход), чтобы проверить навигацию из футера.
      await page.getByRole("contentinfo").getByRole("link", { name: l.name }).click()
      await expect(page).toHaveURL(new RegExp(`${l.path}/?$`))
      await expect(page.getByRole("heading", { level: 1, name: l.h1 })).toBeVisible()

      // Возвращаемся на главную для следующей проверки.
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 })
    }
  })

  /**
   * Название: На каждой странице из футера внизу есть кнопки
   * Описание: Проверяем наличие нижнего action-блока (кнопки навигации) на каждой странице.
   * Минимальный общий знаменатель для этих страниц — «На главную».
   */
  test("Футер: на страницах есть нижние кнопки действий", async ({ page }) => {
    const pages = [
      { path: "/about", expectedButtons: ["На главную"] },
      { path: "/blog", expectedButtons: ["На главную"] },
      { path: "/careers", expectedButtons: ["На главную", "Перейти к контактам"] },
      // На странице контактов нет “На главную”, но есть кнопки-линки в блоке “Полезные ссылки”.
      { path: "/contacts", expectedButtons: ["О проекте", "Конфиденциальность"] },
      { path: "/privacy", expectedButtons: ["На главную", "Контакты"] },
    ] as const

    for (const p of pages) {
      await page.goto(p.path)

      // Проверяем наличие action-кнопок/ссылок на странице (внизу или в соответствующем action-блоке).
      // Используем role=link, т.к. в проекте часто Button рендерится как Link через `asChild`.
      for (const name of p.expectedButtons) {
        await expect(page.getByRole("link", { name })).toBeVisible()
      }

      // Доп. проверка, что на странице вообще есть хотя бы одна “кнопка действия”:
      // либо <button>, либо ссылка (Link) с button-стилем.
      const buttons = page.getByRole("button")
      const links = page.getByRole("link")
      expect((await buttons.count()) + (await links.count())).toBeGreaterThan(0)
    }
  })
})

