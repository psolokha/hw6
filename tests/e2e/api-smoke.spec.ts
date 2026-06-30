import { test, expect } from "@playwright/test"

test.describe("API smoke", () => {
  test("Backend healthcheck", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:4000/api/health")
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body).toEqual({ ok: true })
  })

  test("Backend categories", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:4000/api/categories")
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(Array.isArray(body)).toBeTruthy()
    expect(body.length).toBeGreaterThan(0)
  })

  test("Protected endpoint: favorites requires auth (401)", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:4000/api/favorites")
    expect(res.status()).toBe(401)
  })

  test("Protected endpoint: invalid JWT returns 401 (not 500)", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:4000/api/favorites", {
      headers: { Authorization: "Bearer invalid.token.value" },
    })
    expect(res.status()).toBe(401)
  })
})
