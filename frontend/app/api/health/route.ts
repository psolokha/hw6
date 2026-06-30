import { NextResponse } from "next/server"

import { getBackendUrl } from "@/lib/backend-url"

type CheckResult = {
  status: "ok" | "error" | "skipped"
  latencyMs?: number
  message?: string
}

const BACKEND_TIMEOUT_MS = 5_000

export async function GET() {
  const started = Date.now()
  let backend: CheckResult

  try {
    const res = await fetch(`${getBackendUrl()}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    })
    const body = (await res.json()) as { ok?: boolean }
    const ok = res.ok && body.ok === true
    backend = {
      status: ok ? "ok" : "error",
      latencyMs: Date.now() - started,
      message: ok ? undefined : `backend HTTP ${res.status}`,
    }
  } catch (err) {
    backend = {
      status: "error",
      latencyMs: Date.now() - started,
      message: err instanceof Error ? err.message : "backend unreachable",
    }
  }

  const ok = backend.status === "ok"

  return NextResponse.json(
    {
      ok,
      timestamp: new Date().toISOString(),
      checks: { backend },
    },
    { status: ok ? 200 : 503 },
  )
}
