# Документация интеграций (HW6)

## Архитектура

| Компонент | Root | Prod URL |
|-----------|------|----------|
| Frontend (Next.js) | `frontend/` | https://hw6-pi-ruddy.vercel.app |
| Backend (Fastify, serverless) | `backend/` | https://hw6-ac72.vercel.app |
| БД / Auth | Supabase | — |

Браузер → Frontend → Backend API (`NEXT_PUBLIC_BACKEND_URL`) и Supabase Auth. Backend → Supabase + OSM (Nominatim/Overpass).

Backend на Vercel: `backend/api/index.ts` (без `listen()`), rewrite в `backend/vercel.json`.

## CI/CD

**CI** — `.github/workflows/ci.yml` (push/PR в `main`):

| Job | Проверки |
|-----|----------|
| `quality` | Prettier, ESLint, `npm audit --audit-level=high` |
| `frontend` / `backend` | typecheck + build |
| `e2e` | Playwright (27 тестов, `OSM_MOCK=1`; нужны GitHub Secrets) |

**CD** — Vercel автодеплой при merge в `main`. Коммиты должны быть от автора, привязанного к аккаунту Vercel (иначе деплой `BLOCKED`).

**Uptime** — `.github/workflows/uptime-monitor.yml` (cron 15 мин, prod health).

### GitHub Actions Secrets (E2E)

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWKS_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`.

### Переменные Vercel

**Backend:** `CORS_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWKS_URL`.

**Frontend:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_YM_COUNTER_ID` (опционально).

Примеры: `backend/.env.example`, `frontend/.env.example`.

## OAuth2 (Google + Supabase)

Flow: `signInWithOAuth` (PKCE) → Google → Supabase callback → client page `/auth/callback` вызывает `exchangeCodeForSession` в браузере → Supabase session сохраняется во frontend storage → API с Bearer JWT. Backend: `GET /api/auth/me` (JWKS) возвращает профиль и `provider`.

Проверка OAuth callback покрыта mocked E2E: `tests/e2e/oauth.spec.ts` подменяет Supabase token exchange, проверяет состояние `Выйти` во frontend и запрос `/api/auth/me` с Bearer JWT.

**Настройка (один раз):**

1. Google Cloud → OAuth client (Web): redirect URI `https://<ref>.supabase.co/auth/v1/callback`.
2. Supabase → Providers → Google (Client ID/Secret).
3. Supabase → URL Configuration: Site URL `https://hw6-pi-ruddy.vercel.app`, Redirect URLs `…/auth/callback` (local + prod).

Переменные Vercel для OAuth не нужны.

## Аналитика

**Яндекс.Метрика** — `NEXT_PUBLIC_YM_COUNTER_ID`, компонент `yandex-metrika.tsx`, события через `lib/analytics.ts` (`location_selected`, `route_built`, `oauth_start`, …). CSP в `next.config.mjs`.

**Vercel Analytics** — встроенный, prod only.

## Платежи

Шаг 5 пропущен (опционально в задании). См. `artifacts/hw6/step5.md`.

## Безопасность

Полный отчёт: [security_audit.md](security_audit.md).

Кратко: Next.js 16.2.9, helmet + rate-limit + body limit на backend, CSP на frontend, JWT через JWKS, Zod-валидация, санитизация `externalUrl`, `npm audit` в CI.

## Health Check

| Endpoint | Проверяет |
|----------|-----------|
| `GET …/api/health` (backend) | Supabase DB, JWKS, OSM (инфо) |
| `GET …/api/health` (frontend) | доступность backend |

503 при недоступности критичных зависимостей. Код: `backend/src/core/health-checks.ts`, `frontend/app/api/health/route.ts`.

## Мониторинг

- Vercel Analytics (page views, Web Vitals)
- GitHub Actions uptime workflow + E2E smoke
- Алерты: GitHub Watch → Actions

## Логирование

Backend: JSON-логи (Pino) в stdout → Vercel Runtime Logs. Redact секретов/PII (`log-sanitize.ts`). Уровень: `LOG_LEVEL` (default `info`).

AI-промпты для разбора логов и образцы: `artifacts/hw6/log-samples/`.

## Использование AI

- CI/CD конфигурация — Cursor Agent (шаг 1)
- Аудит безопасности — `npm audit` + AI security-review (шаг 2)
- События аналитики, оптимизации — AI-анализ (шаги 4, 8)
- Промпты анализа логов (шаг 7)

## Отчёты по шагам

`artifacts/hw6/step1.md` … `step9.md` — детали по каждому шагу.
