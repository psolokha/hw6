"use client"

import { useState } from "react"
import { Mountain, Building2, Palmtree, Landmark, Utensils, Camera } from "lucide-react"
import { cn } from "@/lib/utils"

const categories = [
  { id: "all", label: "Все маршруты", icon: null },
  { id: "nature", label: "Природа", icon: Mountain },
  { id: "city", label: "Город", icon: Building2 },
  { id: "beach", label: "Пляж", icon: Palmtree },
  { id: "culture", label: "Культура", icon: Landmark },
  { id: "food", label: "Еда и вино", icon: Utensils },
  { id: "photo", label: "Фотография", icon: Camera },
]

interface CategoryTabsProps {
  onCategoryChange?: (category: string) => void
}

export function CategoryTabs({ onCategoryChange }: CategoryTabsProps) {
  const [active, setActive] = useState("all")

  const handleClick = (id: string) => {
    setActive(id)
    onCategoryChange?.(id)
  }

  return (
    <div className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto py-4 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => handleClick(category.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  active === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {category.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
