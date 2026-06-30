import { z } from "zod";

import { getSupabaseAdmin } from "../db/supabase.js";

export type CheckStatus = "ok" | "error" | "skipped";

export type HealthCheckResult = {
  status: CheckStatus;
  latencyMs?: number;
  message?: string;
};

export type HealthChecks = {
  database: HealthCheckResult;
  auth: HealthCheckResult;
  osm: HealthCheckResult;
};

export type HealthResponse = {
  ok: boolean;
  timestamp: string;
  checks: HealthChecks;
};

const jwksSchema = z.object({
  SUPABASE_JWKS_URL: z.string().url(),
});

const CHECK_TIMEOUT_MS = 5_000;
const OSM_CHECK_TIMEOUT_MS = 8_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "unknown error";
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const started = Date.now();
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("provider_cache").select("cache_key").limit(1)),
      CHECK_TIMEOUT_MS,
      "database",
    );
    if (error) throw error;
    return { status: "ok", latencyMs: Date.now() - started };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - started,
      message: errorMessage(err),
    };
  }
}

async function checkAuth(): Promise<HealthCheckResult> {
  const started = Date.now();
  try {
    const { SUPABASE_JWKS_URL } = jwksSchema.parse(process.env);
    const res = await fetch(SUPABASE_JWKS_URL, {
      method: "GET",
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`JWKS HTTP ${res.status}`);
    }
    return { status: "ok", latencyMs: Date.now() - started };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - started,
      message: errorMessage(err),
    };
  }
}

async function checkOsm(): Promise<HealthCheckResult> {
  if (process.env.OSM_MOCK === "1" || process.env.CI === "true") {
    return { status: "skipped", message: "OSM mock mode" };
  }

  const started = Date.now();
  const baseUrl = process.env.OSM_NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org";
  const userAgent = process.env.OSM_USER_AGENT;

  try {
    const url = new URL("/status.php", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
    const headers: Record<string, string> = userAgent ? { "User-Agent": userAgent } : {};
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(OSM_CHECK_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`OSM status HTTP ${res.status}`);
    }
    return { status: "ok", latencyMs: Date.now() - started };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - started,
      message: errorMessage(err),
    };
  }
}

function isCritical(check: HealthCheckResult): boolean {
  return check.status === "error";
}

export async function runHealthChecks(): Promise<HealthResponse> {
  const [database, auth, osm] = await Promise.all([checkDatabase(), checkAuth(), checkOsm()]);
  const checks = { database, auth, osm };
  const ok = !isCritical(database) && !isCritical(auth);

  return {
    ok,
    timestamp: new Date().toISOString(),
    checks,
  };
}
