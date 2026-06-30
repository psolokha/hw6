"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Heart, MapPinned } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FavoritesEntryDTO, PoiDTO } from "@/data/types"
import { getNavigatorDataSource } from "@/lib/navigator-client"
import { useToast } from "@/hooks/use-toast"
import { withBasePath } from "@/lib/with-base-path"

function openInMaps(lat: number, lng: number) {
  const url = `https://yandex.ru/maps/?pt=${lng},${lat}&z=16&l=map`
  window.open(url, "_blank", "noopener,noreferrer")
}

function newEntryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `fav-${Date.now()}`
}

export function PoiDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const nav = useMemo(() => getNavigatorDataSource(), [])
  const [poi, setPoi] = useState<PoiDTO | null | undefined>(undefined)

  useEffect(() => {
    if (!id) {
      setPoi(null)
      return
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    if (!backendUrl) {
      setPoi(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const p = await fetch(new URL(`/api/pois/${encodeURIComponent(id)}`, backendUrl)).then(
          (r) => (r.ok ? (r.json() as Promise<PoiDTO>) : null)
        )
        if (!cancelled) setPoi(p)
      } catch {
        if (!cancelled) setPoi(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const coordsLine = useMemo(() => {
    if (!poi) return ""
    return `${poi.location.lat.toFixed(6)}, ${poi.location.lng.toFixed(6)}`
  }, [poi])

  const savePoi = () => {
    if (!poi) return
    const entry: FavoritesEntryDTO = {
      type: "poi",
      id: newEntryId(),
      createdAtIso: new Date().toISOString(),
      poi,
    }
    void (async () => {
      try {
        await nav.saveFavorite(entry)
        toast({ title: "Сохранено", description: "Объект добавлен в избранное." })
      } catch {
        toast({ title: "Уже в избранном", description: "Этот объект уже сохранён." })
      }
    })()
  }

  if (poi === undefined) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">Загрузка…</div>
    )
  }

  if (!poi) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Объект не найден.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Назад
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-2 px-0" asChild>
        <Link href="/catalog">
          <ArrowLeft className="h-4 w-4" />
          К каталогу
        </Link>
      </Button>

      <article className="overflow-hidden rounded-xl border border-border bg-card">
        {poi.photoUrl ? (
          <div className="aspect-video w-full overflow-hidden bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBasePath(poi.photoUrl)} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-secondary text-sm text-muted-foreground">
            Нет изображения
          </div>
        )}

        <div className="space-y-4 p-4 sm:p-6">
          <header>
            <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">{poi.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-sm text-muted-foreground">
              <MapPinned className="h-4 w-4" />
              {coordsLine}
            </p>
          </header>

          {poi.description ? (
            <p className="text-sm leading-relaxed text-foreground">{poi.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Описание отсутствует в данных.</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" onClick={() => openInMaps(poi.location.lat, poi.location.lng)}>
              <ExternalLink className="h-4 w-4" />
              Открыть в картах
            </Button>
            <Button variant="outline" className="gap-2" onClick={savePoi}>
              <Heart className="h-4 w-4" />
              В избранное
            </Button>
            {poi.externalUrl ? (
              <Button variant="outline" asChild>
                <a href={poi.externalUrl} target="_blank" rel="noopener noreferrer">
                  Подробнее
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  )
}

