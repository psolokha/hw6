"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"
import { getYmCounterId, trackPageView } from "@/lib/analytics"

function YandexMetrikaPageViews() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const counterId = getYmCounterId()
    if (!counterId) return
    const qs = searchParams?.toString()
    const url = qs ? `${pathname}?${qs}` : pathname
    trackPageView(url)
  }, [pathname, searchParams])

  return null
}

export function YandexMetrika() {
  const counterId = getYmCounterId()
  if (!counterId) return null

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(${counterId}, "init", {clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false,defer:true});`}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${counterId}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
      <YandexMetrikaPageViews />
    </>
  )
}
