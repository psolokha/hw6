# Шаг 4. Интеграция аналитики

## Итог

Шаг 4 выполнен: **Яндекс.Метрика** с кастомными целями на проде (данные поступают), дополнение Vercel Analytics.

## Что сделано

- **Frontend**
  - `frontend/lib/analytics.ts` — `trackEvent`, `trackPageView`, константы событий.
  - `frontend/components/yandex-metrika.tsx` — тег Метрики + хиты при смене маршрута (App Router).
  - Подключение в `app/layout.tsx` (Suspense).
  - События: выбор локации, старт маршрута, сборка, построение, избранное, вход/OAuth.
- **Безопасность / privacy**
  - CSP: `mc.yandex.ru`, `mc.yandex.com` в script/connect/img.
  - Webvisor отключён; раздел «Аналитика» на `/privacy`.
- **Конфиг**
  - `NEXT_PUBLIC_YM_COUNTER_ID` в `.env.example` и `integration_documentation.md`.
- **Документация**: секция «Аналитика» в `integration_documentation.md` (события, настройка, проверка).

## Проверки

```bash
npm run format:check && npm run lint
npm --prefix frontend run typecheck && npm --prefix frontend run build
npm --prefix backend run typecheck && npm --prefix backend run build
npm run test:e2e
```

Ручная проверка после настройки счётчика:
- Network → запросы к `mc.yandex.ru`.
- Метрика → «В реальном времени» — визит и цели после действий на https://hw6-pi-ruddy.vercel.app.
