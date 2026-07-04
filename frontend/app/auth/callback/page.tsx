"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import { formatOAuthError } from "@/lib/oauth"
import { supabase } from "@/lib/supabase-client"

function getSafeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/catalog"
  return value
}

function buildAuthErrorUrl(message: string): string {
  return `/catalog?auth_error=${encodeURIComponent(formatOAuthError(message))}`
}

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const exchanged = useRef(false)
  const [message, setMessage] = useState("Завершаем вход через Google…")

  useEffect(() => {
    if (exchanged.current) return
    exchanged.current = true

    const code = searchParams.get("code")
    const oauthError = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")
    const next = getSafeNext(searchParams.get("next"))

    if (oauthError) {
      window.location.replace(buildAuthErrorUrl(errorDescription ?? oauthError))
      return
    }

    if (!code) {
      window.location.replace("/catalog")
      return
    }

    void (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        setMessage("Не удалось завершить вход.")
        window.location.replace(buildAuthErrorUrl(error.message))
        return
      }

      window.location.replace(next)
    })()
  }, [searchParams])

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4">
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        {message}
      </div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4">
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
            Завершаем вход через Google…
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
