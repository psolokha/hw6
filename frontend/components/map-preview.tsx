"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type YMapsMap = {
  destroy: () => void
  setCenter: (coords: number[], zoom?: number, options?: Record<string, unknown>) => void
}

type Marker = {
  id: number
  name: string
  coords: [number, number]
}

const markers: Marker[] = [
  { id: 1, name: "Красная площадь", coords: [55.75393, 37.620795] },
  { id: 2, name: "Парк Зарядье", coords: [55.751574, 37.628016] },
  { id: 3, name: "Храм Христа Спасителя", coords: [55.744716, 37.605515] },
  { id: 4, name: "Александровский сад", coords: [55.752023, 37.612456] },
  { id: 5, name: "Большой театр", coords: [55.760186, 37.618711] },
]

export function MapPreview() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<YMapsMap | null>(null)
  const [mode, setMode] = useState<"ymaps" | "fallback">("ymaps")
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    let disposed = false
    let waitTimer: number | null = null

    async function initMap() {
      try {
        const hasYmaps = typeof window !== "undefined" && "ymaps" in window
        if (!hasYmaps) {
          const apiKeyRaw = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY
          const apiKey = (apiKeyRaw ?? "").trim()
          const isMissingKey =
            !apiKey || apiKey.toLowerCase() === "undefined" || apiKey.toLowerCase() === "your_api_key"

          if (isMissingKey) {
            // В учебном проекте ключ может отсутствовать — показываем статичное демо-превью,
            // чтобы UI не выглядел как "ошибка".
            setMode("fallback")
            setHint('Чтобы включить интерактивную карту, задайте NEXT_PUBLIC_YANDEX_MAPS_API_KEY и перезапустите dev-сервер.')
            return
          }

          const existing = document.getElementById("yandex-maps-api")
          if (existing) {
            // Скрипт уже добавлен (например, из-за двойного монтирования в dev).
            // Дожидаемся появления `window.ymaps` и создаём карту.
            waitTimer = window.setInterval(() => {
              const ym = (window as typeof window & { ymaps?: any }).ymaps
              if (!ym) return
              if (waitTimer) window.clearInterval(waitTimer)
              waitTimer = null
              ym.ready(createMap)
            }, 50)
            return
          }

          const script = document.createElement("script")
          const srcBase = "https://api-maps.yandex.ru/2.1/?lang=ru_RU"
          script.id = "yandex-maps-api"
          script.src = `${srcBase}&apikey=${apiKey}`
          script.async = true
          script.onload = () => {
            const ym = (window as typeof window & { ymaps: any }).ymaps
            ym.ready(createMap)
          }
          script.onerror = () => {
            setMode("fallback")
            setHint("Не удалось загрузить Yandex Maps API — проверьте ключ и сеть.")
          }
          document.head.appendChild(script)
          return
        }
        const ym = (window as typeof window & { ymaps: any }).ymaps
        ym.ready(createMap)
      } catch {
        setMode("fallback")
        setHint("Не удалось инициализировать карту.")
      }
    }

    function createMap() {
      if (disposed || !containerRef.current || mapRef.current) return
      const ym = (window as typeof window & { ymaps: any }).ymaps

      const map = new ym.Map(containerRef.current, {
        center: markers[0].coords,
        zoom: 13,
        controls: ["zoomControl", "typeSelector", "fullscreenControl"],
      })

      markers.forEach((marker, idx) => {
        map.geoObjects.add(
          new ym.Placemark(
            marker.coords,
            {
              hintContent: marker.name,
              balloonContent: `${idx + 1}. ${marker.name}`,
            },
            {
              preset: "islands#redCircleDotIconWithCaption",
              iconCaption: String(idx + 1),
            }
          )
        )
      })

      map.geoObjects.add(
        new ym.Polyline(
          [...markers.map((m) => m.coords), markers[0].coords],
          { hintContent: "Маршрут" },
          { strokeColor: "#ef4444", strokeWidth: 4, strokeOpacity: 0.8 }
        )
      )

      mapRef.current = map
    }

    void initMap()

    return () => {
      disposed = true
      if (waitTimer) {
        window.clearInterval(waitTimer)
        waitTimer = null
      }
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [])

  const centerOnUser = () => {
    if (!navigator.geolocation || !mapRef.current) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.setCenter([pos.coords.latitude, pos.coords.longitude], 15, { duration: 250 })
      },
      () => {
        setHint("Не удалось получить геолокацию")
        setTimeout(() => setHint(null), 2500)
      }
    )
  }

  return (
    <Card className="relative h-[400px] overflow-hidden border-border bg-secondary/30 lg:h-[500px]">
      <div ref={containerRef} className="absolute inset-0" />

      {mode === "fallback" ? (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1000 700"
          preserveAspectRatio="none"
          aria-label="Демо-превью карты"
        >
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#E2E8F0" />
              <stop offset="1" stopColor="#F1F5F9" />
            </linearGradient>
            <linearGradient id="route" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="1" stopColor="#f97316" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1000" height="700" fill="url(#bg)" />

          {/* lightweight "streets" */}
          <g stroke="#94A3B8" strokeOpacity="0.35" strokeWidth="2">
            <path d="M50 120 C 240 80, 420 160, 620 130 S 860 100, 960 160" fill="none" />
            <path d="M60 260 C 260 220, 420 320, 620 280 S 820 240, 950 310" fill="none" />
            <path d="M40 420 C 240 380, 440 480, 640 440 S 860 400, 970 470" fill="none" />
            <path d="M80 560 C 280 520, 460 620, 660 580 S 840 520, 980 610" fill="none" />
          </g>

          {/* route path */}
          <path
            d="M160 500 C 260 380, 420 560, 520 420 S 740 360, 820 260"
            stroke="url(#route)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="2 16"
            fill="none"
          />

          {/* pins */}
          {[
            { x: 160, y: 500 },
            { x: 360, y: 520 },
            { x: 520, y: 420 },
            { x: 700, y: 370 },
            { x: 820, y: 260 },
          ].map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="12" fill="#0F172A" fillOpacity="0.55" />
              <circle cx={p.x} cy={p.y} r="6" fill="#ef4444" fillOpacity="0.9" />
            </g>
          ))}
        </svg>
      ) : null}

      <Button
        variant="outline"
        className="absolute bottom-4 left-4 gap-2 bg-card/90 backdrop-blur-sm"
        onClick={centerOnUser}
        disabled={mode !== "ymaps"}
      >
        <Navigation className="h-4 w-4" />
        Моё местоположение
      </Button>

      {hint ? (
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-md bg-card/95 px-3 py-2 text-xs text-muted-foreground shadow">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{hint}</span>
        </div>
      ) : null}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 rounded-lg bg-card/90 p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span>5 остановок</span>
          <span className="text-border">|</span>
          <span>2,4 км</span>
        </div>
      </div>
    </Card>
  )
}
