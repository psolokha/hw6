"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, User } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { OAuthButtons } from "@/components/oauth-buttons"
import { AnalyticsEvents, trackEvent } from "@/lib/analytics"
import { formatOAuthError } from "@/lib/oauth"
import { supabase } from "@/lib/supabase-client"

type AuthMode = "login" | "register"

function getSafeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/catalog"
  return value
}

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = getSafeNext(searchParams.get("next"))
  const initialAuthError = searchParams.get("auth_error")
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(
    initialAuthError ? formatOAuthError(initialAuthError) : null,
  )
  const [authInfo, setAuthInfo] = useState<string | null>(null)
  const [authedEmail, setAuthedEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthedEmail(data.session?.user.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthedEmail(session?.user.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const resetMessages = () => {
    setAuthError(null)
    setAuthInfo(null)
  }

  const handleSubmit = () => {
    void (async () => {
      resetMessages()
      if (!email.trim() || !password) {
        setAuthError("Укажите email и пароль")
        return
      }

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setAuthError(error.message)
          return
        }
        trackEvent(AnalyticsEvents.AUTH_LOGIN)
        router.replace(next)
        return
      }

      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setAuthError(error.message)
        return
      }

      trackEvent(AnalyticsEvents.AUTH_SIGNUP)
      if (data.session) {
        router.replace(next)
        return
      }

      setAuthInfo(
        "Регистрация успешна. Если включено подтверждение email — проверьте почту, затем войдите.",
      )
      setMode("login")
    })()
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        {authedEmail ? (
          <div className="space-y-5">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">Вы уже вошли</h1>
              <p className="mt-2 text-sm text-muted-foreground">{authedEmail}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => void supabase.auth.signOut()}
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </Button>
              <Button asChild>
                <Link href={next}>Продолжить</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                {mode === "login" ? "Вход" : "Регистрация"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Войдите, чтобы синхронизировать избранное и использовать OAuth.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "login" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => {
                  resetMessages()
                  setMode("login")
                }}
              >
                Вход
              </Button>
              <Button
                type="button"
                variant={mode === "register" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => {
                  resetMessages()
                  setMode("register")
                }}
              >
                Регистрация
              </Button>
            </div>

            {authError ? (
              <Alert variant="destructive">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            ) : null}

            {authInfo ? (
              <Alert>
                <AlertDescription>{authInfo}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="auth-page-email">Email</Label>
              <Input
                id="auth-page-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-page-password">Пароль</Label>
              <Input
                id="auth-page-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button className="w-full gap-2" onClick={handleSubmit}>
              <User className="h-4 w-4" />
              {mode === "login" ? "Войти" : "Зарегистрироваться"}
            </Button>

            {mode === "login" ? (
              <OAuthButtons
                onError={(message) => {
                  resetMessages()
                  setAuthError(message)
                }}
              />
            ) : null}
          </div>
        )}
      </div>
    </main>
  )
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={null}>
        <AuthPageContent />
      </Suspense>
    </div>
  )
}
