"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { LatLng, PoiDTO } from "@/data/types"
import { getNavigatorDataSource } from "@/lib/navigator-client"
import {
  clearPendingRoutePoiIds,
  loadLocation,
  peekPendingRoutePoiIds,
  peekPendingRoutePois,
  saveRouteBuildDraft,
} from "@/lib/app-storage"
import { AnalyticsEvents, trackEvent } from "@/lib/analytics"

const MIN_KM = 2
const MAX_KM = 50
const DEFAULT_LOCATION_ID = "loc-moscow"

export default function RouteBuildPage() {
  const router = useRouter()
  const nav = useMemo(() => getNavigatorDataSource(), [])
  const [poiIds, setPoiIds] = useState<string[]>([])
  const [lengthInput, setLengthInput] = useState("10")
  const [lengthError, setLengthError] = useState<string | null>(null)
  const [startKind, setStartKind] = useState<"geo" | "map">("geo")
  const [mapPoint, setMapPoint] = useState<LatLng | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false)
  const [selectedLocationTitle, setSelectedLocationTitle] = useState<string | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string>(DEFAULT_LOCATION_ID)

  useEffect(() => {
    const ids = peekPendingRoutePoiIds()
    setPoiIds(ids)
  }, [])

  useEffect(() => {
    const loc = loadLocation()
    setHasSelectedLocation(Boolean(loc))
    setSelectedLocationTitle(loc?.title ?? null)

    if (loc?.mode === "city") {
      setSelectedLocationId(loc.locationId)
    } else if (loc?.mode === "nearby") {
      setSelectedLocationId("nearby")
    } else {
      setSelectedLocationId(DEFAULT_LOCATION_ID)
    }

    if (loc?.center) {
      setMapPoint(loc.center)
      // Для стабильности в браузере/e2e: по умолчанию старт от центра области, не GPS.
      setStartKind("map")
    }
  }, [])

  const isDemoFallback = poiIds.length === 0

  const [resolvedPois, setResolvedPois] = useState<PoiDTO[]>([])
  const [loadingPois, setLoadingPois] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingPois(true)

      const cached = peekPendingRoutePois()
      if (cached.length >= 3) {
        if (!cancelled) {
          setResolvedPois(cached)
          setLoadingPois(false)
        }
        return
      }

      const loc = loadLocation()
      if (!loc) {
        if (!cancelled) {
          setResolvedPois([])
          setLoadingPois(false)
        }
        return
      }

      try {
        const params =
          loc.mode === "nearby"
            ? ({
                by: "nearby" as const,
                center: loc.center,
                radiusMeters: loc.radiusMeters,
              } as const)
            : ({ by: "location" as const, location: loc } as const)
        const list = await nav.getPois(params)
        const ids = peekPendingRoutePoiIds()
        const picked = ids.length ? list.filter((p) => ids.includes(p.id)) : list
        if (!cancelled) setResolvedPois(picked.length >= 3 ? picked : list)
      } catch {
        if (!cancelled) setResolvedPois([])
      } finally {
        if (!cancelled) setLoadingPois(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [nav])

  const validateLength = (): number | null => {
    const raw = lengthInput.replace(",", ".").trim()
    const n = Number(raw)
    if (!Number.isFinite(n) || raw === "") {
      setLengthError("Введите одно число — ориентир длины в километрах.")
      return null
    }
    if (n < MIN_KM || n > MAX_KM) {
      setLengthError(`Допустимый диапазон: от ${MIN_KM} до ${MAX_KM} км.`)
      return null
    }
    setLengthError(null)
    return n
  }

  const resolveStart = (): Promise<LatLng> => {
    if (startKind === "map") {
      if (mapPoint) return Promise.resolve(mapPoint)
      return Promise.reject(
        new Error("Не выбрана точка на карте (в веб-MVP используется центр области)."),
      )
    }
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Геолокация недоступна. Выберите «точка на карте»."))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () =>
          reject(new Error("Не удалось получить координаты. Выберите старт «центр области» ниже.")),
        { enableHighAccuracy: true, timeout: 12_000 },
      )
    })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeoError(null)
    const km = validateLength()
    if (km === null) return
    if (resolvedPois.length < 3) {
      setGeoError("В выборке меньше трёх точек. Вернитесь в каталог.")
      return
    }
    setSubmitting(true)
    try {
      let start: LatLng
      try {
        start = await resolveStart()
      } catch {
        const loc = loadLocation()
        if (!loc?.center) throw new Error("Нет центра области для старта.")
        start = loc.center
        setStartKind("map")
      }
      saveRouteBuildDraft({
        targetDistanceKm: km,
        start,
        startKind,
        poiIds: resolvedPois.map((p) => p.id),
        pois: resolvedPois,
      })
      clearPendingRoutePoiIds()
      trackEvent(AnalyticsEvents.ROUTE_BUILD_SUBMIT, {
        target_km: km,
        poi_count: resolvedPois.length,
      })
      router.replace("/route/results")
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : "Не удалось подготовить маршрут")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
          Собрать маршрут
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ориентир длины кольцевого пешего маршрута и стартовая точка.
        </p>
      </div>

      {isDemoFallback && !hasSelectedLocation ? (
        <Alert>
          <AlertTitle className="font-bold">Локация не выбрана</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Локация по-умолчанию: <span className="font-semibold text-foreground">Москва</span>
              </span>

              <Button variant="outline" size="sm" asChild className="w-fit">
                <Link href="/location">Выбрать локацию</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : isDemoFallback && hasSelectedLocation ? (
        <Alert>
          <AlertTitle className="font-bold">Локация выбрана</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Текущая локация:{" "}
                <span className="font-semibold text-foreground">
                  {selectedLocationTitle ?? "—"}
                </span>
              </span>

              <Button variant="outline" size="sm" asChild className="w-fit">
                <Link href="/catalog">Выбрать точки в каталоге</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : loadingPois ? (
        <p className="text-sm text-muted-foreground">Загрузка точек для маршрута…</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Точек в выборке:{" "}
          <span className="font-medium text-foreground">{resolvedPois.length}</span>
          {resolvedPois.length < 3 ? (
            <span className="block text-destructive">
              Нужно не менее трёх — вернитесь в каталог.
            </span>
          ) : null}
        </p>
      )}

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-6 rounded-xl border border-border bg-card p-4 sm:p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="len">Длинна маршрута, км</Label>
          <Input
            id="len"
            inputMode="decimal"
            value={lengthInput}
            onChange={(e) => {
              setLengthInput(e.target.value)
              setLengthError(null)
            }}
            onBlur={() => validateLength()}
            className="max-w-xs"
          />
          {lengthError ? <p className="text-sm text-destructive">{lengthError}</p> : null}
        </div>

        <div className="space-y-3">
          <Label>Старт маршрута</Label>
          <RadioGroup value={startKind} onValueChange={(v) => setStartKind(v as "geo" | "map")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="geo" id="start-geo" />
              <Label htmlFor="start-geo" className="font-normal">
                Текущее местоположение
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="map" id="start-map" />
              <Label htmlFor="start-map" className="font-normal">
                Центр выбранной области
              </Label>
            </div>
          </RadioGroup>
          {startKind === "map" && mapPoint ? (
            <p className="text-xs font-mono text-muted-foreground">
              {mapPoint.lat.toFixed(5)}, {mapPoint.lng.toFixed(5)}
            </p>
          ) : null}
        </div>

        {geoError ? (
          <p className="text-sm text-destructive" role="alert">
            {geoError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting || loadingPois || resolvedPois.length < 3}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Построить
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/catalog">Назад к каталогу</Link>
          </Button>
        </div>
      </form>

      <div className="flex gap-2 text-xs text-muted-foreground">
        <Navigation className="h-3.5 w-3.5 shrink-0" />
        <span>
          Если GPS недоступен, старт подставится из центра области после попытки геолокации.
        </span>
      </div>
    </div>
  )
}
