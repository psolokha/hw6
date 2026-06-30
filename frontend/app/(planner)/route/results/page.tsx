"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ExternalLink, Heart, Loader2, Route } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { FavoritesEntryDTO, PoiDTO, RouteVariantDTO } from "@/data/types"
import { ApiError } from "@/data/errors"
import { getNavigatorDataSource } from "@/lib/navigator-client"
import { loadRouteBuildDraft } from "@/lib/app-storage"
import { useToast } from "@/hooks/use-toast"

const kindLabel: Record<RouteVariantDTO["kind"], string> = {
  shorter: "Короче",
  near: "Около",
  longer: "Длиннее",
}

function formatDistance(m: number) {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} км`
  return `${Math.round(m)} м`
}

function openPointInYandex(lat: number, lng: number) {
  const url = `https://yandex.ru/maps/?pt=${lng},${lat}&z=16&l=map`
  window.open(url, "_blank", "noopener,noreferrer")
}

function openRouteInYandex(variant: RouteVariantDTO) {
  if (!variant.stops.length) return

  // `rtext` ожидает точки как `lat,lon~lat,lon...`
  // Чтобы маршрут совпал с тем, что считаем на странице как кольцо,
  // добавляем стартовую точку и замыкаем обратно на неё.
  const points = [
    `${variant.start.lat},${variant.start.lng}`,
    ...variant.stops.map((s) => `${s.poi.location.lat},${s.poi.location.lng}`),
    `${variant.start.lat},${variant.start.lng}`,
  ]

  const rtext = points.join("~")
  const url = `https://yandex.ru/maps/?rtext=${encodeURIComponent(rtext)}&rtt=pd&l=map`
  window.open(url, "_blank", "noopener,noreferrer")
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `fav-${Date.now()}`
}

export default function RouteResultsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const nav = useMemo(() => getNavigatorDataSource(), [])
  const [variants, setVariants] = useState<RouteVariantDTO[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCatalogLink, setShowCatalogLink] = useState(false)

  useEffect(() => {
    const draft = loadRouteBuildDraft()
    if (!draft) {
      router.replace("/route/build")
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
        setShowCatalogLink(false)
      try {
        const pois = (draft.pois ?? []).filter(Boolean) as PoiDTO[]
        if (!pois.length) {
          setError("Не удалось восстановить список точек. Вернитесь в каталог и выберите точки заново.")
          setShowCatalogLink(true)
          setVariants([])
          return
        }

        if (pois.length < 3) {
          setError("В выборке меньше трёх достопримечательностей — расширьте область или снимите фильтры.")
          setVariants([])
          return
        }

        const list = await nav.buildRouteVariants({
          start: draft.start,
          pois,
          targetDistanceKm: draft.targetDistanceKm,
          maxVariants: 3,
        })
        if (!cancelled) setVariants(list)
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiError) setError(e.message)
            else {
              setError("Не удалось построить маршрут.")
              setShowCatalogLink(true)
            }
          setVariants([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [nav, router])

  const saveRoute = (v: RouteVariantDTO) => {
    const entry: FavoritesEntryDTO = {
      type: "route",
      id: newId(),
      createdAtIso: new Date().toISOString(),
      route: v,
      title: `Маршрут · ${formatDistance(v.totalDistanceMeters)}`,
    }
    void (async () => {
      try {
        await nav.saveFavorite(entry)
        toast({ title: "Сохранено", description: "Маршрут добавлен в избранное." })
      } catch {
        toast({ title: "Уже в избранном", description: "Этот вариант уже сохранён." })
      }
    })()
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span>Строим варианты…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">Варианты маршрута</h1>
          <p className="text-sm text-muted-foreground">До трёх кольцевых вариантов с порядком остановок.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/catalog">К каталогу</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          {showCatalogLink ? (
            <div className="mt-2">
              <Button variant="link" className="h-auto p-0 text-sm" asChild>
                <Link href="/catalog">К выбору достопремичательностей</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {variants && variants.length ? (
        <ul className="space-y-6">
          {variants.map((v) => (
            <li
              key={v.id}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/40 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{kindLabel[v.kind]}</span>
                  <Badge variant="secondary">{formatDistance(v.totalDistanceMeters)}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() =>
                      openRouteInYandex(v)
                    }
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Открыть в картах
                  </Button>
                  <Button size="sm" className="gap-1" onClick={() => saveRoute(v)}>
                    <Heart className="h-3.5 w-3.5" />
                    В избранное
                  </Button>
                </div>
              </div>
              <ol className="divide-y divide-border">
                {v.stops.map((s) => (
                  <li key={s.order} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {s.order}
                      </span>
                      <span className="font-medium">{s.poi.title}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 gap-1 self-start sm:self-center"
                      onClick={() => openPointInYandex(s.poi.location.lat, s.poi.location.lng)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Карты
                    </Button>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      ) : !error ? (
        <p className="text-sm text-muted-foreground">Нет вариантов для отображения.</p>
      ) : null}

      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/">На главную</Link>
        </Button>
      </div>
    </div>
  )
}
