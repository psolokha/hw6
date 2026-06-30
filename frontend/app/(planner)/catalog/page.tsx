"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Loader2, MapPin, Plus, Route, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import type { CategoryDTO, Id, LocationSelectionDTO, PoiDTO } from "@/data/types"
import { ApiError } from "@/data/errors"
import { getNavigatorDataSource } from "@/lib/navigator-client"
import { loadLocation, setPendingRoutePois } from "@/lib/app-storage"
import { cn } from "@/lib/utils"
import { withBasePath } from "@/lib/with-base-path"

const PAGE_SIZE = 4

function locationLabel(loc: LocationSelectionDTO): string {
  if (loc.mode === "city") return loc.title
  return `${loc.title} · ${(loc.radiusMeters / 1000).toFixed(1)} км`
}

export default function CatalogPage() {
  const router = useRouter()
  const nav = useMemo(() => getNavigatorDataSource(), [])
  const [location, setLocation] = useState<LocationSelectionDTO | null>(null)
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [selectedCats, setSelectedCats] = useState<Set<Id>>(new Set())
  const [pois, setPois] = useState<PoiDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<Id>>(new Set())

  useEffect(() => {
    const loc = loadLocation()
    if (!loc) {
      router.replace("/location")
      return
    }
    setLocation(loc)
  }, [router])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const cats = await nav.getCategories()
        if (!cancelled) setCategories(cats)
      } catch {
        if (!cancelled) setCategories([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [nav])

  const categoryIds = useMemo(() => {
    if (selectedCats.size === 0) return undefined
    return Array.from(selectedCats).sort()
  }, [selectedCats])

  const reloadPois = useCallback(async () => {
    const loc = loadLocation()
    if (!loc) return
    setLoading(true)
    setError(null)
    setPage(1)
    try {
      const params =
        loc.mode === "city"
          ? ({ by: "location" as const, location: loc, categoryIds } as const)
          : ({
              by: "nearby" as const,
              center: loc.center,
              radiusMeters: loc.radiusMeters,
              categoryIds,
            } as const)
      const list = await nav.getPois(params)
      setPois(list)
    } catch (e) {
      if (e instanceof ApiError) setError(e.message)
      else setError("Не удалось загрузить каталог")
      setPois([])
    } finally {
      setLoading(false)
    }
  }, [nav, categoryIds])

  useEffect(() => {
    if (!location) return
    void reloadPois()
  }, [location, reloadPois])

  const toggleCategory = (id: Id) => {
    setSelectedCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearFilters = () => {
    setSelectedCats(new Set())
  }

  const visibleCount = page * PAGE_SIZE
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!normalizedQuery) return pois
    return pois.filter((p) => {
      const hay = `${p.title} ${p.description ?? ""}`.toLowerCase()
      return hay.includes(normalizedQuery)
    })
  }, [normalizedQuery, pois])

  const recommended = useMemo(() => {
    // Эвристика «популярности»: исключаем еду, чтобы не засорять список.
    return filtered.filter((p) => !p.categories.includes("food")).slice(0, 12)
  }, [filtered])

  const rest = useMemo(() => {
    const recIds = new Set(recommended.map((p) => p.id))
    return filtered.filter((p) => !recIds.has(p.id))
  }, [filtered, recommended])

  const visible = rest.slice(0, visibleCount)
  const hasMore = visibleCount < rest.length
  const categoryTitleById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.title] as const)),
    [categories],
  )

  const selectedPois = useMemo(() => {
    if (!selectedIds.size) return []
    const byId = new Map(pois.map((p) => [p.id, p] as const))
    return Array.from(selectedIds)
      .map((id) => byId.get(id))
      .filter(Boolean) as PoiDTO[]
  }, [pois, selectedIds])

  const goBuildRoute = (e: React.MouseEvent) => {
    if (selectedPois.length < 3 || loading) {
      e.preventDefault()
      return
    }
    setPendingRoutePois(selectedPois)
  }

  if (!location) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">Каталог</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{locationLabel(location)}</span>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link href="/location">Сменить</Link>
            </Button>
          </p>
        </div>
        <Button
          className="gap-2 self-start sm:self-auto"
          asChild
          disabled={selectedPois.length < 3 || loading}
          title={selectedPois.length < 3 ? "Выберите не менее трёх точек" : undefined}
        >
          <Link href="/route/build" onClick={goBuildRoute}>
            <Route className="h-4 w-4" />
            Собрать маршрут
          </Link>
        </Button>
      </div>

      {selectedPois.length < 3 && !loading ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          Для построения маршрута выберите не менее трёх достопримечательностей ниже.
        </p>
      ) : null}

      {selectedPois.length < 3 && loading ? (
        <p className="text-sm text-muted-foreground">Загрузка каталога…</p>
      ) : null}

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Категории:</span>
          {categories.map((c) => (
            <Badge
              key={c.id}
              variant={selectedCats.has(c.id) ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-3 py-1",
                selectedCats.has(c.id) ? "" : "hover:bg-secondary",
              )}
              onClick={() => toggleCategory(c.id)}
            >
              {c.title}
            </Badge>
          ))}
          {selectedCats.size ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Сбросить
            </Button>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4" />
            <span>
              Выбрано: <span className="font-medium text-foreground">{selectedPois.length}</span>
            </span>
          </div>
          {selectedIds.size ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="h-4 w-4" />
              Очистить выбор
            </Button>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Поиск по названию/описанию…"
              className="h-11 pl-10"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}{" "}
          <Button
            variant="link"
            className="h-auto p-0 align-baseline"
            onClick={() => void reloadPois()}
          >
            Повторить
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Загрузка каталога… Первый запрос к OpenStreetMap может занять до минуты.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          {selectedCats.size
            ? "По выбранным категориям ничего не найдено. Сбросьте фильтры."
            : "В этой области пока нет объектов. Попробуйте сменить локацию или категорию."}
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">Рекомендуем</h2>
              <span className="text-xs text-muted-foreground">
                {normalizedQuery ? "по результатам поиска" : "популярное рядом"}
              </span>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {recommended.map((p) => {
                const picked = selectedIds.has(p.id)
                return (
                  <li key={p.id} className="relative">
                    <Link
                      href={`/poi/${p.id}`}
                      className="flex overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
                    >
                      {p.photoUrl ? (
                        <div className="relative h-28 w-28 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={withBasePath(p.photoUrl)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-28 w-28 shrink-0 items-center justify-center bg-secondary text-xs text-muted-foreground">
                          Нет фото
                        </div>
                      )}
                      <div className="min-w-0 flex-1 p-3">
                        <h2 className="font-serif font-semibold text-foreground">{p.title}</h2>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {p.description ?? "Описание появится при наличии в API."}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {p.categories.map((catId) => (
                            <Badge
                              key={catId}
                              variant="secondary"
                              className="px-2 py-0 text-[10px] font-normal"
                            >
                              {categoryTitleById[catId] ?? catId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Link>
                    <Button
                      type="button"
                      size="icon"
                      variant={picked ? "default" : "secondary"}
                      className="absolute right-3 top-3 h-9 w-9 rounded-full"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedIds((prev) => {
                          const next = new Set(prev)
                          if (next.has(p.id)) next.delete(p.id)
                          else next.add(p.id)
                          return next
                        })
                      }}
                      title={picked ? "Убрать из маршрута" : "Добавить в маршрут"}
                    >
                      {picked ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </section>

          <div className="mt-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Все места</h2>
            <span className="text-xs text-muted-foreground">
              Показано {Math.min(visibleCount, rest.length)} из {rest.length}
            </span>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {visible.map((p) => (
              <li key={p.id} className="relative">
                <Link
                  href={`/poi/${p.id}`}
                  className="flex overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
                >
                  {p.photoUrl ? (
                    <div className="relative h-28 w-28 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={withBasePath(p.photoUrl)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center bg-secondary text-xs text-muted-foreground">
                      Нет фото
                    </div>
                  )}
                  <div className="min-w-0 flex-1 p-3">
                    <h2 className="font-serif font-semibold text-foreground">{p.title}</h2>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {p.description ?? "Описание появится при наличии в API."}
                    </p>
                    <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                      {p.location.lat.toFixed(5)}, {p.location.lng.toFixed(5)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.categories.map((catId) => (
                        <Badge
                          key={catId}
                          variant="secondary"
                          className="px-2 py-0 text-[10px] font-normal"
                        >
                          {categoryTitleById[catId] ?? catId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Link>
                <Button
                  type="button"
                  size="icon"
                  variant={selectedIds.has(p.id) ? "default" : "secondary"}
                  className="absolute right-3 top-3 h-9 w-9 rounded-full"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedIds((prev) => {
                      const next = new Set(prev)
                      if (next.has(p.id)) next.delete(p.id)
                      else next.add(p.id)
                      return next
                    })
                  }}
                  title={selectedIds.has(p.id) ? "Убрать из маршрута" : "Добавить в маршрут"}
                >
                  {selectedIds.has(p.id) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
          {hasMore ? (
            <Button
              variant="outline"
              className="mt-4 w-full sm:w-auto"
              onClick={() => setPage((p) => p + 1)}
            >
              Показать ещё
            </Button>
          ) : null}
        </>
      )}

      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/">На главную</Link>
        </Button>
      </div>
    </div>
  )
}
