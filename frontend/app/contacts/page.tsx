import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"

export default function ContactsPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">Контакты</h1>
          <p className="text-muted-foreground">Как связаться по вопросам проекта NearStep.</p>
        </header>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Обратная связь</h2>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>
              - <span className="font-medium text-foreground">Вопросы/идеи</span>: через issues/репозиторий проекта (если
              используете GitHub).
            </p>
            <p>
              - <span className="font-medium text-foreground">Ошибки</span>: приложите шаги воспроизведения и скрин/лог
              из консоли браузера.
            </p>
            <p>
              - <span className="font-medium text-foreground">Участие</span>: посмотрите раздел{" "}
              <Link href="/careers" className="underline-offset-4 hover:underline">
                вакансий
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Полезные ссылки</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/about">О проекте</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/privacy">Конфиденциальность</Link>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

