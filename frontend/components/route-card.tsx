"use client"

import { MouseEvent } from "react"
import { Clock, MapPin, Heart } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PoiDTO } from "@/data/types"
import { withBasePath } from "@/lib/with-base-path"

function stopsLabel(n: number) {
  const m = n % 100
  if (m >= 11 && m <= 14) return `${n} остановок`
  const r = n % 10
  if (r === 1) return `${n} остановка`
  if (r >= 2 && r <= 4) return `${n} остановки`
  return `${n} остановок`
}

interface RouteCardProps {
  title: string
  location: string
  duration: string
  stops: number
  image: string
  tags: string[]
  saved?: boolean
  onOpen?: () => void
  onToggleSaved?: () => void
  opened?: boolean
  pois?: PoiDTO[]
}

export function RouteCard({
  title,
  location,
  duration,
  stops,
  image,
  tags,
  saved = false,
  onOpen,
  onToggleSaved,
  opened = false,
  pois,
}: RouteCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen?.()
      }}
      className="group cursor-pointer overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={withBasePath(image)}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card"
          onClick={(e: MouseEvent) => {
            e.stopPropagation()
            onToggleSaved?.()
          }}
        >
          <Heart
            className={`h-4 w-4 ${saved ? "fill-primary text-primary" : "text-muted-foreground"}`}
          />
        </Button>
      </div>
      <CardContent className="p-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
        <h3 className="mb-1 font-serif text-lg font-semibold leading-tight text-foreground">
          {title}
        </h3>
        <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{stopsLabel(stops)}</span>
          </div>
        </div>

        {opened ? (
          <div className="mt-4 border-t border-border pt-4">
            <div className="text-sm font-medium text-foreground">Объекты в маршруте</div>
            {pois?.length ? (
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                {pois.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/poi/${p.id}`}
                      className="underline-offset-4 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Нет объектов для отображения.</p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
