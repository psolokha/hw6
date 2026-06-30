"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LogIn, LogOut, MapPin, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { LocationIndicator } from "@/components/location-indicator"
import { supabase } from "@/lib/supabase-client"
import { clearFavorites, loadFavorites } from "@/lib/app-storage"

type AuthMode = "login" | "register"

const nav: { href: string; label: string; active: (path: string) => boolean }[] = [
  { href: "/location", label: "Выбор локации", active: (p) => p.startsWith("/location") },
  { href: "/catalog", label: "Каталог", active: (p) => p.startsWith("/catalog") },
  { href: "/route/build", label: "Маршрут", active: (p) => p.startsWith("/route") },
  { href: "/favorites", label: "Избранное", active: (p) => p.startsWith("/favorites") },
]

function AuthDialogContent({
  email,
  password,
  authMode,
  authError,
  authInfo,
  onEmailChange,
  onPasswordChange,
  onModeChange,
  onSubmit,
}: {
  email: string
  password: string
  authMode: AuthMode
  authError: string | null
  authInfo: string | null
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onModeChange: (mode: AuthMode) => void
  onSubmit: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={authMode === "login" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => onModeChange("login")}
        >
          Вход
        </Button>
        <Button
          type="button"
          variant={authMode === "register" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => onModeChange("register")}
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
        <Label htmlFor="auth-email">Email</Label>
        <Input id="auth-email" value={email} onChange={(e) => onEmailChange(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="auth-password">Пароль</Label>
        <Input
          id="auth-password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
      </div>
      <Button className="w-full gap-2" onClick={onSubmit}>
        <User className="h-4 w-4" />
        {authMode === "login" ? "Войти" : "Зарегистрироваться"}
      </Button>
    </div>
  )
}

export function AppHeader() {
  const pathname = usePathname()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [open, setOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authInfo, setAuthInfo] = useState<string | null>(null)
  const [authedEmail, setAuthedEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthedEmail(data.session?.user.email ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setAuthedEmail(session?.user.email ?? null)
      if (session?.access_token) {
        const local = loadFavorites()
        if (local.length) {
          void fetch(new URL("/api/favorites/sync", process.env.NEXT_PUBLIC_BACKEND_URL), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(local),
          })
            .then((res) => {
              if (res.ok) clearFavorites()
            })
            .catch(() => {
              // keep local favorites for retry on next auth state change
            })
        }
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const resetAuthMessages = () => {
    setAuthError(null)
    setAuthInfo(null)
  }

  const handleAuthSubmit = () => {
    void (async () => {
      resetAuthMessages()
      if (!email.trim() || !password) {
        setAuthError("Укажите email и пароль")
        return
      }

      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setAuthError(error.message)
          return
        }
        setOpen(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setAuthError(error.message)
        return
      }

      if (data.session) {
        setOpen(false)
        return
      }

      setAuthInfo("Регистрация успешна. Если включено подтверждение email — проверьте почту, затем войдите.")
      setAuthMode("login")
    })()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-lg font-semibold tracking-tight">NearStep</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.active(pathname)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocationIndicator className="hidden md:flex" />
          {authedEmail ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 md:inline-flex"
              onClick={() => void supabase.auth.signOut()}
              title={authedEmail}
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          ) : (
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v)
                if (!v) resetAuthMessages()
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="hidden gap-2 md:inline-flex">
                  <LogIn className="h-4 w-4" />
                  Войти
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{authMode === "login" ? "Вход" : "Регистрация"}</DialogTitle>
                </DialogHeader>
                <AuthDialogContent
                  email={email}
                  password={password}
                  authMode={authMode}
                  authError={authError}
                  authInfo={authInfo}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onModeChange={(mode) => {
                    setAuthMode(mode)
                    resetAuthMessages()
                  }}
                  onSubmit={handleAuthSubmit}
                />
              </DialogContent>
            </Dialog>
          )}
          <div className="flex md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Меню">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {nav.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
                {authedEmail ? (
                  <DropdownMenuItem onClick={() => void supabase.auth.signOut()}>Выйти</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      resetAuthMessages()
                      setOpen(true)
                    }}
                  >
                    Войти
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/">На главную</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
