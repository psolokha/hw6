import { readFileSync, existsSync } from "fs";
import path from "path";
import { defineConfig, devices } from "@playwright/test";

function loadEnvFile(filePath: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(filePath)) return out;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    out[key] = value;
  }
  return out;
}

const root = __dirname;
const backendEnv = loadEnvFile(path.join(root, "backend", ".env"));
const frontendEnv = {
  ...loadEnvFile(path.join(root, "frontend", ".env")),
  ...loadEnvFile(path.join(root, "frontend", ".env.local")),
};

// Только test-user credentials — не переносим PORT и прочие backend-переменные в process.env,
// иначе Next.js dev server попытается слушать порт 4000.
if (backendEnv.TEST_USER_EMAIL) process.env.TEST_USER_EMAIL = backendEnv.TEST_USER_EMAIL;
if (backendEnv.TEST_USER_PASSWORD) process.env.TEST_USER_PASSWORD = backendEnv.TEST_USER_PASSWORD;
for (const key of [
  "NEXT_PUBLIC_BACKEND_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]) {
  if (!process.env[key] && frontendEnv[key]) process.env[key] = frontendEnv[key];
}

export default defineConfig({
  testDir: path.join(root, "tests", "e2e"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  timeout: 60_000,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev:e2e",
      cwd: path.join(root, "backend"),
      url: "http://127.0.0.1:4000/api/health",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        ...backendEnv,
        CI: "true",
        OSM_MOCK: "1",
      },
    },
    {
      command: "npm run build && npm run start -- -H 127.0.0.1",
      cwd: path.join(root, "frontend"),
      url: "http://127.0.0.1:3000",
      reuseExistingServer: false,
      timeout: 240_000,
      env: {
        ...process.env,
        ...frontendEnv,
        NEXT_PUBLIC_DISABLE_VERCEL_ANALYTICS: "1",
        PORT: "3000",
      },
    },
  ],
});
