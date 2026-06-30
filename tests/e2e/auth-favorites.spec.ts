import { test, expect } from "@playwright/test"
import { initStorage, ROME_LOCATION } from "./_storage"

const email = process.env.TEST_USER_EMAIL
const password = process.env.TEST_USER_PASSWORD

test.describe("Авторизация и серверное избранное", () => {
  test.skip(!email || !password, "TEST_USER_EMAIL и TEST_USER_PASSWORD должны быть заданы в backend/.env")

  test.beforeEach(async ({ page }) => {
    await initStorage(page, { location: ROME_LOCATION })
  })

  test("Избранное сохраняется на сервере после входа", async ({ page }) => {
    await page.goto("/catalog")

    await page.getByRole("button", { name: "Войти" }).click()
    await page.getByLabel("Email").fill(email!)
    await page.getByLabel("Пароль").fill(password!)
    await page.getByRole("button", { name: "Войти", exact: true }).click()

    await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible({ timeout: 15_000 })

    await page.goto("/poi/poi-rome-colosseum")
    await page.getByRole("button", { name: "В избранное" }).click({ timeout: 30_000 })

    await page.goto("/favorites")
    await expect(page.getByRole("link", { name: "Колизей" })).toBeVisible({ timeout: 15_000 })

    // Очищаем localStorage — данные должны остаться с сервера
    await page.evaluate(() => localStorage.removeItem("hw4_nav_favorites_v1"))
    await page.reload()

    await expect(page.getByRole("link", { name: "Колизей" })).toBeVisible({ timeout: 15_000 })
  })
})
