import { Map, Users, Route, Star } from "lucide-react"

const stats = [
  { label: "Маршрутов создано", value: "12 400+", icon: Route },
  { label: "Активных путешественников", value: "8 200+", icon: Users },
  { label: "Стран", value: "95", icon: Map },
  { label: "Средняя оценка", value: "4,9", icon: Star },
]

export function StatsSection() {
  return (
    <section className="border-y border-border bg-card py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
