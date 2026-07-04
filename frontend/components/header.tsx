"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LogOut, MapPin, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LocationIndicator } from "@/components/location-indicator"
import { supabase } from "@/lib/supabase-client"

export function Header() {
  const pathname = usePathname()
  const [authedEmail, setAuthedEmail] = useState<string | null>(null)
  const authHref = `/auth?next=${encodeURIComponent(pathname || "/")}`

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthedEmail(data.session?.user.email ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthedEmail(session?.user.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">NearStep</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/location"
            className="text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            Выбор локации
          </Link>
          <Link
            href="/catalog"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Каталог
          </Link>
          <Link
            href="/favorites"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Избранное
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LocationIndicator />
          {authedEmail ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 md:flex"
              onClick={() => void supabase.auth.signOut()}
              title={authedEmail}
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
              <Link href={authHref} aria-label="Войти" title="Войти">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <Button className="hidden md:flex" asChild>
            <Link href="/route/build">Маршрут</Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/location">Выбор локации</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/catalog">Каталог</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/favorites">Избранное</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/route/build">Маршрут</Link>
              </DropdownMenuItem>
              {authedEmail ? (
                <DropdownMenuItem onClick={() => void supabase.auth.signOut()}>
                  Выйти
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href={authHref}>Войти</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
