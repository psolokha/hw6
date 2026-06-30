"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { loadLocation } from "@/lib/app-storage"

export function LocationIndicator({ className }: { className?: string }) {
  const pathname = usePathname()
  const [locationTitle, setLocationTitle] = useState<string>("Локация не выбрана")

  useEffect(() => {
    const refresh = () => {
      const sel = loadLocation()
      setLocationTitle(sel?.title ?? "Локация не выбрана")
    }

    refresh()

    // `storage` срабатывает только между вкладками, но всё равно полезен.
    window.addEventListener("storage", refresh)

    // На всякий случай обновляем при возврате фокуса (частый кейс: смена локации -> назад).
    window.addEventListener("focus", refresh)

    return () => {
      window.removeEventListener("storage", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [pathname])

  return (
    <Button
      variant="ghost"
      className={["hidden max-w-[220px] items-center gap-2 md:flex", className]
        .filter(Boolean)
        .join(" ")}
      asChild
    >
      <Link href="/location" title={locationTitle}>
        <MapPin className="h-4 w-4" />
        <span className="truncate text-sm">{locationTitle}</span>
      </Link>
    </Button>
  )
}
