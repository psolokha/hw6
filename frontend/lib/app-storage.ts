import type { FavoritesEntryDTO, Id, LatLng, LocationSelectionDTO, PoiDTO } from '@/data/types'
import { makeRouteVariantIdFromRoute } from '@/lib/route-id'

const KEY_LOCATION = 'hw4_nav_location_v1'
const KEY_FAVORITES = 'hw4_nav_favorites_v1'
const KEY_ROUTE_BUILD = 'hw4_nav_route_build_v1'
const KEY_ROUTE_POI_IDS = 'hw4_nav_route_poi_ids_v1'
const KEY_ROUTE_POIS = 'hw4_nav_route_pois_v1'

export type RouteBuildDraft = {
  targetDistanceKm: number
  start: LatLng
  startKind: 'geo' | 'map'
  poiIds: Id[]
  pois?: PoiDTO[]
}

export function loadLocation(): LocationSelectionDTO | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY_LOCATION)
    if (!raw) return null
    return JSON.parse(raw) as LocationSelectionDTO
  } catch {
    return null
  }
}

export function saveLocation(selection: LocationSelectionDTO) {
  localStorage.setItem(KEY_LOCATION, JSON.stringify(selection))
}

export function clearLocation() {
  localStorage.removeItem(KEY_LOCATION)
}

export function setPendingRoutePois(pois: PoiDTO[]) {
  sessionStorage.setItem(KEY_ROUTE_POIS, JSON.stringify(pois))
  sessionStorage.setItem(KEY_ROUTE_POI_IDS, JSON.stringify(pois.map((p) => p.id)))
}

export function peekPendingRoutePois(): PoiDTO[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(KEY_ROUTE_POIS)
    if (!raw) return []
    return JSON.parse(raw) as PoiDTO[]
  } catch {
    return []
  }
}

export function setPendingRoutePoiIds(ids: Id[]) {
  sessionStorage.setItem(KEY_ROUTE_POI_IDS, JSON.stringify(ids))
  sessionStorage.removeItem(KEY_ROUTE_POIS)
}

export function clearPendingRoutePoiIds() {
  sessionStorage.removeItem(KEY_ROUTE_POI_IDS)
  sessionStorage.removeItem(KEY_ROUTE_POIS)
}

export function peekPendingRoutePoiIds(): Id[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(KEY_ROUTE_POI_IDS)
    if (!raw) return []
    return JSON.parse(raw) as Id[]
  } catch {
    return []
  }
}

export function saveRouteBuildDraft(draft: RouteBuildDraft) {
  localStorage.setItem(KEY_ROUTE_BUILD, JSON.stringify(draft))
}

export function loadRouteBuildDraft(): RouteBuildDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY_ROUTE_BUILD)
    if (!raw) return null
    return JSON.parse(raw) as RouteBuildDraft
  } catch {
    return null
  }
}

export function clearRouteBuildDraft() {
  localStorage.removeItem(KEY_ROUTE_BUILD)
}

export function loadFavorites(): FavoritesEntryDTO[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY_FAVORITES)
    if (!raw) return []
    const list = JSON.parse(raw) as FavoritesEntryDTO[]

    // Миграция: в старой версии `route.id` генерировался только по типу варианта,
    // из-за чего `addFavorite()` мог считать разные маршруты дубликатами.
    let didChange = false
    const migrated = list.map((e) => {
      if (e.type !== 'route') return e

      const normalizedRouteId = makeRouteVariantIdFromRoute(e.route)
      if (e.route.id === normalizedRouteId) return e

      didChange = true
      return {
        ...e,
        route: {
          ...e.route,
          id: normalizedRouteId,
        },
      }
    })

    if (didChange) writeFavorites(migrated)
    return migrated
  } catch {
    return []
  }
}

function writeFavorites(entries: FavoritesEntryDTO[]) {
  localStorage.setItem(KEY_FAVORITES, JSON.stringify(entries))
}

export function addFavorite(entry: FavoritesEntryDTO): { ok: true } | { ok: false; reason: 'duplicate' } {
  const list = loadFavorites()
  const normalizedEntry: FavoritesEntryDTO =
    entry.type === 'route'
      ? {
          ...entry,
          route: {
            ...entry.route,
            id: makeRouteVariantIdFromRoute(entry.route),
          },
        }
      : entry

  if (normalizedEntry.type === 'poi') {
    if (list.some((e) => e.type === 'poi' && e.poi.id === normalizedEntry.poi.id)) {
      return { ok: false, reason: 'duplicate' }
    }
  } else {
    if (list.some((e) => e.type === 'route' && e.route.id === normalizedEntry.route.id)) {
      return { ok: false, reason: 'duplicate' }
    }
  }
  writeFavorites([normalizedEntry, ...list])
  return { ok: true }
}

export function removeFavorite(id: Id) {
  const list = loadFavorites().filter((e) => e.id !== id)
  writeFavorites(list)
}

export function clearFavorites() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY_FAVORITES)
}
