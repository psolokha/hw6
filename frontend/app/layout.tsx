import type { Metadata } from "next"
import { Suspense } from "react"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { YandexMetrika } from "@/components/yandex-metrika"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext", "cyrillic-ext"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "NearStep — пешие маршруты рядом",
  description:
    "Достопримечательности и кольцевые пешие маршруты рядом с вами: каталог, фильтры, до трёх вариантов, избранное.",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
