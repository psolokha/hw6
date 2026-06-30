import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">Конфиденциальность</h1>
          <p className="text-muted-foreground">
            Коротко о том, какие данные использует NearStep в текущей учебной версии.
          </p>
        </header>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Хранение данных</h2>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <p>
              - <span className="font-medium text-foreground">Избранное</span> хранится локально в браузере; после
              входа синхронизируется с backend и Supabase.
            </p>
            <p>
              - <span className="font-medium text-foreground">Черновик сборки маршрута</span> хранится локально и
              используется для перехода между шагами.
            </p>
            <p>
              - <span className="font-medium text-foreground">Локация</span> (город/«рядом со мной») сохраняется, чтобы
              не выбирать её заново при каждом открытии приложения.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Геолокация</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Если вы выбираете режим «рядом со мной», браузер может запросить доступ к геолокации. Координаты используются
            для формирования области поиска POI и передаются на backend только в составе запроса к API.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Как очистить данные</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Вы можете удалить сохранённые данные через настройки сайта в браузере (Local Storage) или очистить
            историю/данные сайта. После очистки избранное и выбранная локация будут сброшены.
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/">На главную</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contacts">Контакты</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  )
}

