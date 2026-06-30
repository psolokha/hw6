# Шаг 1. Настройка CI/CD пайплайна

## Итог

Шаг 1 выполнен и проверен: настроен CI на GitHub Actions, автоматический деплой на Vercel при push в `main`, пайплайн протестирован на коммите (все джобы зелёные).

## Платформа

- **CI**: GitHub Actions (`.github/workflows/ci.yml`).
- **CD / хостинг**: Vercel — два проекта из одного репозитория:
  - frontend (Next.js) → https://hw6-pi-ruddy.vercel.app
  - backend (Fastify) → https://hw6-ac72.vercel.app

## Пайплайн (этапы)

Триггеры: `push` и `pull_request` в `main`. Джобы:

| Job | Этапы |
|-----|-------|
| `quality` | Prettier `--check` (весь код) + ESLint (frontend, `next/core-web-vitals`) |
| `frontend` | install (`npm ci`) → typecheck (`tsc --noEmit`) → build (`next build`) |
| `backend` | install (`npm ci`) → typecheck (`tsc --noEmit`) → build (`tsc`) |
| `e2e` | Playwright (chromium, `OSM_MOCK=1`); поднимает backend+frontend; запускается при наличии секретов |

- **Установка зависимостей** — `npm ci`.
- **Сборка** — `next build` / `tsc`.
- **Тестирование** — Playwright E2E (19 тестов).
- **Деплой** — Vercel автоматически при изменении `main`.
- **Проверки качества кода** — отдельная джоба `quality`:
  - форматирование — Prettier (`format:check`, конфиг `.prettierrc.json`);
  - линтинг — ESLint для фронтенда (`eslint-config-next/core-web-vitals`);
  - типизация — TypeScript `tsc --noEmit` (фронт и бэк) + production build.

## Автоматический деплой

- Деплой обоих проектов на Vercel запускается автоматически при попадании коммита в `main`.
- Healthcheck бэкенда: `GET https://hw6-ac72.vercel.app/api/health` → `{ "ok": true }`.

## Ключевые технические решения

- **Fastify на Vercel**: запуск через serverless-обработчик (`backend/api/index.ts`: `app.ready()` + `server.emit("request")`), без блокирующего `listen()` — устранены таймауты 504. Конфиг `backend/vercel.json` (`framework: null`, rewrite на `/api`).
- **CORS**: значение `CORS_ORIGIN` нормализуется в коде (срез хвостового `/`, поддержка списка через запятую).
- **Backend URL во фронте**: единый резолвер `frontend/lib/backend-url.ts` (env `NEXT_PUBLIC_BACKEND_URL` в приоритете, иначе прод-fallback) — деплой работает без ручной настройки переменной.
- **Деплой-блокировка по Git-автору**: Vercel собирает только коммиты участников аккаунта; git-идентичность приведена к аккаунту-владельцу, после чего прямые push деплоятся.

## Секреты CI (для E2E)

В GitHub → Settings → Secrets and variables → Actions добавлены:
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWKS_URL`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`.

## Проверка пайплайна

- Тестовый коммит в `main` (`0c4a8fc`) → CI run **#10**: `frontend`, `backend`, `e2e` — все **success** (E2E-шаг `Run E2E tests` отработал, не пропущен).
- Локальный прогон E2E перед пушем: **19/19 passed**.
- Прямой push в `main` задеплоился в статус **READY** (деплой-блокировка по автору устранена).
- Сквозная проверка в реальном браузере: запрос с фронта на бэкенд — `200`, CORS корректен.

## Артефакты в репозитории

- `.github/workflows/ci.yml` — конфигурация CI.
- `backend/api/index.ts`, `backend/src/app.ts`, `backend/vercel.json` — деплой Fastify на Vercel.
- `frontend/lib/backend-url.ts` — резолвер URL бэкенда.
- `integration_documentation.md` — общая документация по интеграциям и деплою.
