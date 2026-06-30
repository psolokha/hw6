import { test, expect } from "@playwright/test";

test.describe("API smoke", () => {
  test("Backend healthcheck", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:4000/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.checks.database.status).toBe("ok");
    expect(body.checks.auth.status).toBe("ok");
    expect(body.checks.osm.status).toBe("skipped");
  });

  test("Frontend healthcheck", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.checks.backend.status).toBe("ok");
  });

  test("Backend categories", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:4000/api/categories");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
  });

  test("Protected endpoint: favorites requires auth (401)", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:4000/api/favorites");
    expect(res.status()).toBe(401);
  });

  test("Protected endpoint: invalid JWT returns 401 (not 500)", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:4000/api/favorites", {
      headers: { Authorization: "Bearer invalid.token.value" },
    });
    expect(res.status()).toBe(401);
  });

  test("Auth profile: /api/auth/me requires auth (401)", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:4000/api/auth/me");
    expect(res.status()).toBe(401);
  });

  test("Auth profile: invalid JWT on /api/auth/me returns 401", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:4000/api/auth/me", {
      headers: { Authorization: "Bearer invalid.token.value" },
    });
    expect(res.status()).toBe(401);
  });
});
