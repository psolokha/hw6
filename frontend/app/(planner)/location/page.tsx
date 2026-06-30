"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { LocationSelectionDTO, LocationSuggestionDTO } from "@/data/types"
import { getNavigatorDataSource } from "@/lib/navigator-client"
import { NEARBY_RADIUS_METERS } from "@/lib/app-config"
import { loadLocation, saveLocation } from "@/lib/app-storage"
import { ApiError } from "@/data/errors"

export default function LocationPage() {
  const router = useRouter()
  const nav = useMemo(() => getNavigatorDataSource(), [])
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<LocationSuggestionDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [geoHint, setGeoHint] = useState<string | null>(null)
  const [current, setCurrent] = useState<LocationSelectionDTO | null>(null)

  useEffect(() => {
    setCurrent(loadLocation())
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      setError(null)
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const list = await nav.searchLocations(q)
        setSuggestions(list)
      } catch (e) {
        if (e instanceof ApiError) setError(e.message)
        else setError("Не удалось выполнить поиск")
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 320)
    return () => clearTimeout(t)
  }, [query, nav])

  const pickCity = useCallback(
    (s: LocationSuggestionDTO) => {
      if (!s.center) {
        setError("Для выбранного города нет координат — попробуйте другой вариант из списка")
        return
      }
      const sel: LocationSelectionDTO = {
        mode: "city",
        locationId: s.id,
        title: s.title,
        center: s.center,
      }
      saveLocation(sel)
      setCurrent(sel)
      setGeoHint(null)
      router.push("/catalog")
    },
    [router],
  )

  const pickNearby = useCallback(() => {
    setGeoHint(null)
    if (!navigator.geolocation) {
      setGeoHint("Геолокация недоступна в этом браузере. Выберите город вручную.")
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const sel: LocationSelectionDTO = {
          mode: "nearby",
          title: "Рядом со мной",
          center: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          radiusMeters: NEARBY_RADIUS_METERS,
        }
        saveLocation(sel)
        setCurrent(sel)
        setLoading(false)
        router.push("/catalog")
      },
      () => {
        setLoading(false)
        setGeoHint(
          "Доступ к геолокации запрещён или координаты недоступны. Выберите город вручную или разрешите доступ в настройках браузера.",
        )
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    )
  }, [router])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
          Область поиска
        </h1>
        <p className="mt-2 text-muted-foreground">
          Укажите город по подсказкам или используйте режим «рядом со мной» для каталога в радиусе{" "}
          {(NEARBY_RADIUS_METERS / 1000).toFixed(1)} км.
        </p>
      </div>

      {current ? (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertTitle>Текущая область</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">
              {current.mode === "city"
                ? current.title
                : `${current.title} · радиус ${current.radiusMeters} м`}
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/catalog">К выбору маршрутов</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-sm font-medium text-muted-foreground">Поиск города</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Например: Москва, Санкт-Петербург…"
              className="h-11 pr-10"
              minLength={2}
            />
            {loading ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </div>
        {error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-background">
          {query.trim().length >= 2 && !loading && suggestions.length === 0 && !error ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              Ничего не найдено — измените запрос
            </li>
          ) : null}
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => pickCity(s)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-secondary/60"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium text-foreground">{s.title}</span>
                  {s.subtitle ? (
                    <span className="block text-muted-foreground">{s.subtitle}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-sm font-medium text-muted-foreground">Рядом со мной</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Каталог точек в круге с центром в вашей геолокации (радиус задан в конфигурации
          приложения).
        </p>
        {geoHint ? (
          <Alert className="mt-4" variant="default">
            <AlertTitle>Геолокация</AlertTitle>
            <AlertDescription>{geoHint}</AlertDescription>
          </Alert>
        ) : null}
        <Button className="mt-4 gap-2" onClick={pickNearby} disabled={loading}>
          <Navigation className="h-4 w-4" />
          Использовать текущее местоположение
        </Button>
      </section>

      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/">На главную</Link>
        </Button>
      </div>
    </div>
  )
}
