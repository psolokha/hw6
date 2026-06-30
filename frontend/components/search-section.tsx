"use client"

import { Search, Calendar, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function SearchSection() {
  return (
    <section className="border-b border-border bg-card py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Куда хотите отправиться?"
              className="h-12 border-border bg-background pl-10 text-base"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 gap-2 border-border bg-background"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Любые даты</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 gap-2 border-border bg-background"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Путешественники</span>
            </Button>
            <Button className="h-12 px-6">Найти</Button>
          </div>
        </div>
      </div>
    </section>
  )
}
