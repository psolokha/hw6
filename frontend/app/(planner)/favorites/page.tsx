"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { Heart, MapPin, Route, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FavoritesEntryDTO } from "@/data/types"
import { getNavigatorDataSource } from "@/lib/navigator-client"

function formatDistance(m: number) {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} км`
  return `${Math.round(m)} м`
}

export default function FavoritesPage() {
  const nav = useMemo(() => getNavigatorDataSource(), [])
  const [items, setItems] = useState<FavoritesEntryDTO[]>([])
  const [typeFilter, setTypeFilter] = useState<"all" | "poi" | "route">("all")

  const refresh = useCallback(() => {
    void (async () => {
      const list = await nav.getFavorites()
      setItems(list)
    })()
  }, [nav])

  useEffect(() => {
    refresh()
  }, [refresh])

  const onRemove = (id: string) => {
    void (async () => {
      await nav.removeFavorite(id)
      refresh()
    })()
  }

  const filteredItems = useCallback(() => {
    return items.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false
      return true
    })
  }, [items, typeFilter])

  const openRouteInYandex = useCallback((e: FavoritesEntryDTO) => {
    if (e.type !== "route") return
    const lat = e.route.start.lat
    const lng = e.route.start.lng
    const url = `https://yandex.ru/maps/?pt=${lng},${lat}&z=16&l=map`
    window.open(url, "_blank", "noopener,noreferrer")
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">Избранное</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Если вы вошли в аккаунт — избранное сохраняется на сервере. Иначе — локально в браузере.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Фильтры</div>
            <div className="text-xs text-muted-foreground">Тип</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={typeFilter === "all" ? "default" : "outline"}
              onClick={() => setTypeFilter("all")}
            >
              Все
            </Button>
            <Button
              type="button"
              size="sm"
              variant={typeFilter === "poi" ? "default" : "outline"}
              onClick={() => setTypeFilter("poi")}
            >
              Объекты
            </Button>
            <Button
              type="button"
              size="sm"
              variant={typeFilter === "route" ? "default" : "outline"}
              onClick={() => setTypeFilter("route")}
            >
              Маршруты
            </Button>
          </div>
        </div>
      </section>

      {filteredItems().length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Пока пусто. Добавьте объект или сохраните вариант маршрута.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/catalog">Перейти в каталог</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredItems().map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              {e.type === "poi" ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <BadgeInline>Объект</BadgeInline>
                      <h2 className="font-serif font-semibold text-foreground">
                        <Link href={`/poi/${e.poi.id}`} className="hover:underline">
                          {e.poi.title}
                        </Link>
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.createdAtIso).toLocaleString("ru-RU")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/poi/${e.poi.id}`}>Открыть</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(e.id)}
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Route className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <BadgeInline>Маршрут</BadgeInline>
                      <h2 className="font-serif font-semibold text-foreground">
                        {e.title ?? `Маршрут · ${formatDistance(e.route.totalDistanceMeters)}`}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {e.route.stops.length} остановок ·{" "}
                        {new Date(e.createdAtIso).toLocaleString("ru-RU")}
                      </p>
                      <ol className="mt-2 list-inside list-decimal text-sm text-muted-foreground">
                        {e.route.stops.map((s) => (
                          <li key={s.order}>{s.poi.title}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-start">
                    <Button variant="outline" size="sm" onClick={() => openRouteInYandex(e)}>
                      Открыть
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(e.id)}
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/">На главную</Link>
        </Button>
      </div>
    </div>
  )
}

function BadgeInline({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
      {children}
    </span>
  )
}
