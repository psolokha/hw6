"use client"

import type { BuildRoutesParams, GetPoisParams, NavigatorDataSource, RequestOptions } from "@/data/contracts"
import type { CategoryDTO, FavoritesEntryDTO, Id, LocationSuggestionDTO, PoiDTO, RouteVariantDTO } from "@/data/types"
import { ApiError, type ApiErrorKind } from "@/data/errors"
import { addFavorite, loadFavorites, removeFavorite as removeLocalFavorite } from "@/lib/app-storage"
import { getAccessToken } from "@/lib/supabase-client"
import { getBackendUrl } from "@/lib/backend-url"

async function http<T>(path: string, init?: RequestInit & { signal?: AbortSignal }): Promise<T> {
  const url = new URL(path, getBackendUrl()).toString()
  const res = await fetch(url, init)
  const text = await res.text()

  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  if (!res.ok) {
    const msg = json?.error?.message ?? `HTTP ${res.status}`
    const rawKind = json?.error?.kind
    const kind: ApiErrorKind =
      rawKind === "VALIDATION" || rawKind === "UPSTREAM" || rawKind === "UNKNOWN"
        ? rawKind
        : "UNKNOWN"
    throw new ApiError(msg, { kind, status: res.status })
  }

  return json as T
}

async function authedInit(init?: RequestInit): Promise<RequestInit> {
  const token = await getAccessToken()
  if (!token) return init ?? {}
  return {
    ...(init ?? {}),
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  }
}

export class HttpNavigatorDataSource implements NavigatorDataSource {
  async searchLocations(query: string, opts?: RequestOptions): Promise<LocationSuggestionDTO[]> {
    const q = query.trim()
    if (!q) return []
    return await http<LocationSuggestionDTO[]>(`/api/locations/search?q=${encodeURIComponent(q)}`, {
      signal: opts?.signal,
    })
  }

  async getCategories(opts?: RequestOptions): Promise<CategoryDTO[]> {
    return await http<CategoryDTO[]>("/api/categories", { signal: opts?.signal })
  }

  async getPois(params: GetPoisParams, opts?: RequestOptions): Promise<PoiDTO[]> {
    // Пока backend Stage 3 поддерживает только nearby.
    const q = new URLSearchParams()
    q.set("by", "nearby")

    if (params.by === "nearby") {
      q.set("lat", String(params.center.lat))
      q.set("lng", String(params.center.lng))
      q.set("radiusMeters", String(params.radiusMeters))
      if (params.categoryIds?.length) q.set("categoryIds", params.categoryIds.join(","))
      return await http<PoiDTO[]>(`/api/pois?${q.toString()}`, { signal: opts?.signal })
    }

    // by=location: используем центр (который сохраняем при выборе города через Nominatim)
    const center = params.location.center
    if (!center) return []
    q.set("lat", String(center.lat))
    q.set("lng", String(center.lng))
    // Радиус 5 км — на крупных городах 3 км часто даёт пустую выдачу.
    // Для Nominatim-fallback важнее охват, Overpass использует прицельную выборку.
    q.set("radiusMeters", String(5000))
    q.set("cityTitle", params.location.title)
    if (params.categoryIds?.length) q.set("categoryIds", params.categoryIds.join(","))
    return await http<PoiDTO[]>(`/api/pois?${q.toString()}`, { signal: opts?.signal })
  }

  async buildRouteVariants(params: BuildRoutesParams, opts?: RequestOptions): Promise<RouteVariantDTO[]> {
    return await http<RouteVariantDTO[]>("/api/routes/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: params.start,
        pois: params.pois,
        targetDistanceKm: params.targetDistanceKm,
        maxVariants: params.maxVariants ?? 3,
      }),
      signal: opts?.signal,
    })
  }

  async getFavorites(opts?: RequestOptions): Promise<FavoritesEntryDTO[]> {
    const token = await getAccessToken()
    if (!token) return loadFavorites()

    return await http<FavoritesEntryDTO[]>("/api/favorites", {
      ...(await authedInit()),
      signal: opts?.signal,
    })
  }

  async saveFavorite(entry: FavoritesEntryDTO, opts?: RequestOptions): Promise<void> {
    const token = await getAccessToken()
    if (!token) {
      const r = addFavorite(entry)
      if (!r.ok) throw new ApiError("Уже в избранном", { kind: "UNKNOWN" })
      return
    }

    await http<{ ok: true }>("/api/favorites", {
      ...(await authedInit({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      })),
      signal: opts?.signal,
    })
  }

  async removeFavorite(id: Id, opts?: RequestOptions): Promise<void> {
    const token = await getAccessToken()
    if (!token) {
      removeLocalFavorite(id)
      return
    }

    await http<{ ok: true }>(`/api/favorites/${encodeURIComponent(id)}`, {
      ...(await authedInit({ method: "DELETE" })),
      signal: opts?.signal,
    })
  }
}

