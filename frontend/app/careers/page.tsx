import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const roles = [
  {
    title: "Frontend разработчик (React/Next.js)",
    level: "Junior/Middle",
    format: "Учебный проект",
    stack: ["Next.js", "React", "TypeScript", "Tailwind", "shadcn/ui"],
    description:
      "Улучшать UX, добавлять экраны деталей маршрута, настраивать хранение избранного и интеграции с картами.",
  },
  {
    title: "Product / UX дизайнер",
    level: "Junior",
    format: "Учебный проект",
    stack: ["Figma", "UX writing"],
    description:
      "Прорабатывать сценарии выбора локации и построения маршрута, улучшать карточки и состояние пустых списков.",
  },
]

export default function CareersPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">Вакансии</h1>
          <p className="text-muted-foreground">
            Сейчас это учебный проект, поэтому вакансии — скорее формат участия и задач для практики.
          </p>
        </header>

        <ul className="space-y-4">
          {roles.map((r) => (
            <li key={r.title} className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-lg font-semibold text-foreground">{r.title}</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {r.level}
                  </Badge>
                  <Badge variant="secondary" className="font-normal">
                    {r.format}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.stack.map((s) => (
                  <Badge key={s} variant="outline" className="font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Как присоединиться</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Напишите через страницу <Link className="underline-offset-4 hover:underline" href="/contacts">контактов</Link>{" "}
            и укажите, что хотите взять задачу в работу (UI, логика маршрута, избранное, интеграции).
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/">На главную</Link>
          </Button>
          <Button asChild>
            <Link href="/contacts">Перейти к контактам</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  )
}

