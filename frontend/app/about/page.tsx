import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">О проекте</h1>
          <p className="text-muted-foreground">
            NearStep — учебный проект: подбор достопримечательностей и сборка кольцевых пеших маршрутов.
          </p>
        </header>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Что умеет приложение</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Выбор локации (город или режим «рядом со мной»).</li>
            <li>Каталог объектов с фильтрами и деталями.</li>
            <li>Сборка до трёх вариантов кольцевого маршрута по выбранным точкам.</li>
            <li>Избранное: сохранение объектов и маршрутов локально и на сервере после входа.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Как устроены данные</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Каталог и маршруты загружаются с backend (Fastify + Supabase). POI и локации приходят через OSM-провайдеры.
            Избранное гостя хранится в <span className="font-medium text-foreground">localStorage</span>; после входа
            синхронизируется с сервером через Supabase Auth и API <span className="font-medium text-foreground">/api/favorites</span>.
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  )
}

