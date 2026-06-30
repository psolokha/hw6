# Шаг 4. Интеграция аналитики

## Итог

Шаг 4 выполнен в коде: **Яндекс.Метрика** с кастомными целями для ключевых действий, SPA page views, дополнение существующего Vercel Analytics. Для работы на проде нужно создать счётчик и задать `NEXT_PUBLIC_YM_COUNTER_ID` в Vercel.

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

## Решения и компромиссы

- **Яндекс.Метрика** (не GA): указана в задании, бесплатный tier, согласуется с Yandex Maps; Vercel Analytics сохранён для базовых page views.
- **Опциональный счётчик**: без `NEXT_PUBLIC_YM_COUNTER_ID` аналитика no-op — E2E и локальная разработка не ломаются.
- **Цели через `reachGoal`**: стандартный API Метрики; параметры — через `ym(..., 'params', ...)`.

## Что потребовало участия пользователя

- Создать счётчик на [metrika.yandex.ru](https://metrika.yandex.ru/) и добавить `NEXT_PUBLIC_YM_COUNTER_ID` в Vercel (hw6-frontend).
- Создать цели в интерфейсе Метрики по идентификаторам из `integration_documentation.md`.
