import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] px-4 py-10">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
          Ой! Страница потерялась. Давай попробуем заново
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Возможно, ссылка указала не туда. Вернитесь на главную.
        </p>

        <div className="mt-6">
          <Button asChild>
            <Link href="/">NearStep</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
