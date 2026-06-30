import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const posts = [
  {
    id: "mvp",
    title: "MVP: каталог + маршруты + избранное",
    date: "Апрель 2026",
    tags: ["релиз", "mvp"],
    excerpt:
      "Собрали базовый поток: выбор локации, каталог объектов, построение вариантов маршрута и сохранение в избранное.",
  },
  {
    id: "favorites",
    title: "Как работает избранное в браузере",
    date: "Апрель 2026",
    tags: ["ux", "storage"],
    excerpt:
      "Избранное сохраняется локально (localStorage), поэтому остаётся после перезапуска dev-сервера и между сессиями браузера.",
  },
  {
    id: "routes",
    title: "Почему маршруты — кольцевые",
    date: "Апрель 2026",
    tags: ["маршруты", "логика"],
    excerpt:
      "Чтобы прогулку было проще завершить рядом со стартом, варианты строятся как кольцо со стартовой точкой в центре области.",
  },
]

export default function BlogPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">Блог</h1>
          <p className="text-muted-foreground">
            Небольшие заметки о функциональности и решениях в NearStep.
          </p>
        </header>

        <ul className="grid gap-4">
          {posts.map((p) => (
            <li key={p.id} className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">{p.date}</div>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <h2 className="mt-3 font-serif text-lg font-semibold text-foreground">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
