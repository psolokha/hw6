 "use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Header } from "@/components/header"
import { SearchSection } from "@/components/search-section"
import { CategoryTabs } from "@/components/category-tabs"
import { PopularRoutes } from "@/components/popular-routes"
import { MapPreview } from "@/components/map-preview"
import { StatsSection } from "@/components/stats-section"
import { MapPin } from "lucide-react"

const featuredRoutes = [
  {
    title: "Историческая прогулка по Риму",
    location: "Рим, Италия",
    locationId: "loc-rome",
    center: { lat: 41.8933, lng: 12.4829 },
    duration: "4 часа",
    stops: 8,
    image: "/routes/rome.svg",
    tags: ["Культура", "История"],
  },
  {
    title: "Готический квартал Барселоны",
    location: "Барселона, Испания",
    locationId: "loc-barcelona",
    center: { lat: 41.3851, lng: 2.1734 },
    duration: "3 часа",
    stops: 6,
    image: "/routes/barcelona.svg",
    tags: ["Архитектура", "Город"],
  },
  {
    title: "Тропа храмов Киото",
    location: "Киото, Япония",
    locationId: "loc-kyoto",
    center: { lat: 35.0116, lng: 135.7681 },
    duration: "5 часов",
    stops: 7,
    image: "/routes/kyoto.svg",
    tags: ["Природа", "Культура"],
  },
  {
    title: "Маршрут по Москве: парки и музеи",
    location: "Москва, Россия",
    locationId: "loc-moscow",
    center: { lat: 55.7558, lng: 37.6176 },
    duration: "4 часа",
    stops: 6,
    image: "/routes/moscow.svg",
    tags: ["Культура", "Город"],
  },
]

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all")

  const filteredRoutes = useMemo(() => {
    if (activeCategory === "all") return featuredRoutes

    const categoryTagMap: Record<string, string[]> = {
      nature: ["природа"],
      city: ["город", "архитектура"],
      beach: ["пляж", "вода"],
      culture: ["культура", "история", "искусство", "музеи"],
      food: ["еда", "вино", "ресторан", "гастрономия"],
      photo: ["фотография"],
    }

    const expectedTags = categoryTagMap[activeCategory] ?? []
    return featuredRoutes.filter((route) =>
      route.tags.some((tag) => expectedTags.some((needle) => tag.toLowerCase().includes(needle)))
    )
  }, [activeCategory])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-card py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Откройте для себя
                <br />
                <span className="text-primary">идеальный маршрут</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Планируйте прогулки по подборке маршрутов и точкам интереса: города, парки и
                неочевидные места — с понятным порядком остановок и оценкой длины пути.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/route/build"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Построить маршрут
                </Link>
                <a
                  href="#routes"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Популярные маршруты
                </a>
              </div>
            </div>
            <div className="relative">
              <MapPreview />
            </div>
          </div>
        </div>
      </section>

      <SearchSection />
      <CategoryTabs onCategoryChange={setActiveCategory} />

      {/* Routes Grid */}
      <section id="routes" className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
                Популярные маршруты
              </h2>
              <p className="mt-1 text-muted-foreground">
                Подборка маршрутов, которые нравятся путешественникам
              </p>
            </div>
          </div>

          {filteredRoutes.length ? (
            <PopularRoutes routes={filteredRoutes} />
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
              По выбранному тегу маршруты пока не найдены.
            </p>
          )}
        </div>
      </section>

      <StatsSection />

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-semibold">NearStep</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground">О проекте</Link>
              <Link href="/blog" className="hover:text-foreground">Блог</Link>
              <Link href="/careers" className="hover:text-foreground">Вакансии</Link>
              <Link href="/contacts" className="hover:text-foreground">Контакты</Link>
              <Link href="/privacy" className="hover:text-foreground">Конфиденциальность</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2026 NearStep. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
