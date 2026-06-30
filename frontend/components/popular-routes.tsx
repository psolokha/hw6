"use client"

import { useMemo, useState } from "react"
import { RouteCard } from "@/components/route-card"
import type { FavoritesEntryDTO, LatLng, PoiDTO, RouteStopDTO, RouteVariantDTO } from "@/data/types"
import { loadFavorites } from "@/lib/app-storage"
import { getNavigatorDataSource } from "@/lib/navigator-client"
import { makeRouteVariantId } from "@/lib/route-id"
import { useToast } from "@/hooks/use-toast"

export type FeaturedRoute = {
  title: string
  location: string
  locationId: string
  center: LatLng
  duration: string
  stops: number
  image: string
  tags: string[]
}

function newEntryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `fav-${Date.now()}`
}

function toRad(n: number) {
  return (n * Math.PI) / 180
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function loopDistanceMeters(start: { lat: number; lng: number }, stops: RouteStopDTO[]) {
  if (!stops.length) return 0
  let sum = 0
  let prev = start
  for (const s of stops) {
    sum += haversineMeters(prev, s.poi.location)
    prev = s.poi.location
  }
  sum += haversineMeters(prev, start)
  return Math.round(sum)
}

function makeFeaturedRouteVariant(route: FeaturedRoute): RouteVariantDTO {
  const start = route.center
  const stops: RouteStopDTO[] = []

  return {
    id: makeRouteVariantId({
      kind: "near",
      start,
      stops,
    }),
    kind: "near",
    totalDistanceMeters: 0,
    stops,
    isLoop: true,
    start,
  }
}

export function PopularRoutes({ routes }: { routes: FeaturedRoute[] }) {
  const { toast } = useToast()
  const nav = useMemo(() => getNavigatorDataSource(), [])

  const initialSaved = useMemo(() => {
    const savedRouteIds = new Set<string>()

    // из локального избранного (реальные сохранения)
    for (const e of loadFavorites()) {
      if (e.type === "route") savedRouteIds.add(e.route.id)
    }

    return savedRouteIds
  }, [routes])

  const [saved, setSaved] = useState<Set<string>>(initialSaved)
  const [openedRouteTitle, setOpenedRouteTitle] = useState<string | null>(null)
  const [poisByTitle, setPoisByTitle] = useState<Record<string, PoiDTO[]>>({})

  const handleOpen = (title: string) => {
    setOpenedRouteTitle((prev) => (prev === title ? null : title))
  }

  const handleToggleSaved = (route: FeaturedRoute) => {
    void (async () => {
      // Для демо: подгружаем POI вокруг центра, строим «near» вариант и сохраняем.
      const pois =
        poisByTitle[route.title] ??
        (await nav.getPois({
          by: "nearby",
          center: route.center,
          radiusMeters: 2500,
        }))

      const stopsPois = pois.slice(0, route.stops)
      const stops: RouteStopDTO[] = stopsPois.map((poi, idx) => ({ order: idx + 1, poi }))
      const variant: RouteVariantDTO = {
        id: makeRouteVariantId({ kind: "near", start: route.center, stops }),
        kind: "near",
        totalDistanceMeters: loopDistanceMeters(route.center, stops),
        stops,
        isLoop: true,
        start: route.center,
      }

      const entry: FavoritesEntryDTO = {
        type: "route",
        id: newEntryId(),
        createdAtIso: new Date().toISOString(),
        route: variant,
        title: route.title,
      }

      try {
        await nav.saveFavorite(entry)
        setSaved((prev) => new Set(prev).add(variant.id))
        toast({ title: "Сохранено", description: "Маршрут добавлен в избранное." })
      } catch {
        toast({ title: "Уже в избранном", description: "Этот маршрут уже сохранён." })
      }
    })()
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {routes.map((route) => {
        // Важно: `id` маршрута детерминированный, чтобы корректно работать с избранным.
        const routeId = makeFeaturedRouteVariant(route).id

        return (
          <RouteCard
            key={route.title}
            {...route}
            saved={saved.has(routeId)}
            onOpen={() => {
              handleOpen(route.title)
              if (poisByTitle[route.title]) return
              void (async () => {
                const list = await nav.getPois({
                  by: "nearby",
                  center: route.center,
                  radiusMeters: 2500,
                })
                setPoisByTitle((prev) => ({ ...prev, [route.title]: list.slice(0, route.stops) }))
              })()
            }}
            onToggleSaved={() => handleToggleSaved(route)}
            opened={openedRouteTitle === route.title}
            pois={poisByTitle[route.title]}
          />
        )
      })}
    </div>
  )
}

