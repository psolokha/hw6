# Документация Backend — NearStep (HW5)

## Содержание

1. [Архитектура](#архитектура)
2. [Выбор инфраструктуры](#выбор-инфраструктуры)
3. [Схема базы данных](#схема-базы-данных)
4. [Развертывание](#развертывание)
5. [API endpoints](#api-endpoints)
6. [Безопасность](#безопасность)
7. [Обработка ошибок и логирование](#обработка-ошибок-и-логирование)
8. [Процесс разработки с AI](#процесс-разработки-с-ai)

---

## Архитектура

NearStep — туристический сервис планирования прогулок. Frontend (Next.js) обращается к собственному Backend API (Fastify), который:

- проксирует и кэширует запросы к **OpenStreetMap** (Nominatim + Overpass);
- выполняет бизнес-логику построения маршрутов;
- хранит избранное пользователей в **Supabase Postgres**;
- проверяет JWT через **Supabase Auth**.

```
┌─────────────┐     HTTP + JWT      ┌──────────────┐     service role    ┌─────────────┐
│  Frontend   │ ──────────────────► │   Backend    │ ──────────────────► │  Supabase   │
│  Next.js    │                     │   Fastify    │                     │  Postgres   │
└─────────────┘                     └──────┬───────┘                     └─────────────┘
       │                                   │
       │ anon key                          │ HTTP
       ▼                                   ▼
┌─────────────┐                     ┌──────────────┐
│  Supabase   │                     │  OSM APIs    │
│  Auth       │                     │  Nominatim   │
└─────────────┘                     │  Overpass    │
                                    └──────────────┘
```

### Слои backend

| Слой | Путь | Назначение |
|------|------|------------|
| API | `backend/src/api/` | HTTP-роуты, валидация (zod), auth middleware, формат ошибок |
| Core | `backend/src/core/` | DTO, построение маршрутов, категории, ключи кэша |
| Providers | `backend/src/providers/osm/` | Адаптеры Nominatim, Overpass; mock для CI |
| DB | `backend/src/db/` | Supabase admin client, репозитории `favorites`, `provider_cache` |

### Что хранится где

| Данные | Источник |
|--------|----------|
| Локации, POI | OSM (Nominatim / Overpass), кэш в `provider_cache` |
| Категории, алгоритм маршрутов | Backend (статика + `core/route-builder`) |
| Избранное (авторизованный) | Supabase `favorites` |
| Избранное (гость) | localStorage браузера |
| Сессия пользователя | Supabase Auth (JWT на клиенте) |

Исходный design doc: [plan/plan.md](plan/plan.md).

---

## Выбор инфраструктуры

Выбран **вариант A: Supabase (BaaS)** вместо self-hosted PostgreSQL.

| Критерий | Supabase | Self-hosted |
|----------|----------|-------------|
| Время развертывания | Минуты (облачный проект) | Часы (VPS, Docker, бэкапы) |
| Auth | Встроенный Email/Password + JWT | Нужна своя реализация |
| RLS | Нативная поддержка Postgres RLS | То же, но настраивать вручную |
| Операционные затраты | Free tier для учебного проекта | Аренда VPS, мониторинг |

**Почему свой API поверх Supabase, а не только Supabase REST:**

- OSM-провайдеры требуют серверного прокси, User-Agent и кэширования;
- логика построения маршрутов не должна выполняться на клиенте;
- service role key остаётся только на backend, клиент получает anon key.

---

## Схема базы данных

SQL-миграция: [../backend/migrations/0001_init_favorites_and_provider_cache.sql](../backend/migrations/0001_init_favorites_and_provider_cache.sql).

### Таблица `favorites`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | uuid PK | Идентификатор записи |
| `user_id` | uuid FK → `auth.users` | Владелец |
| `type` | text | `poi` или `route` |
| `payload` | jsonb | `{ poi }` или `{ route, title? }` |
| `created_at` | timestamptz | Дата создания |

**RLS:** пользователь видит/создаёт/удаляет только свои строки (`user_id = auth.uid()`).

### Таблица `provider_cache`

| Поле | Тип | Описание |
|------|-----|----------|
| `cache_key` | text PK | Ключ запроса |
| `provider` | text | `osm` |
| `kind` | text | Тип запроса (nominatim_search, overpass_nearby, …) |
| `request` | jsonb | Параметры запроса |
| `response` | jsonb | Кэшированный ответ |
| `expires_at` | timestamptz | TTL |

**RLS:** включён без permissive policies — доступ только через service role на backend.

---

## Развертывание

### 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. **Authentication → Providers → Email:** включите Email/Password.
3. Для локальной разработки рекомендуется **отключить Confirm email** (Authentication → Settings), иначе после `signUp` потребуется подтверждение по почте.
4. Создайте тестового пользователя: Authentication → Users → Add user (или через UI регистрации приложения).

### 2. Применить миграцию

Supabase Dashboard → **SQL Editor** → выполните содержимое файла  
[../backend/migrations/0001_init_favorites_and_provider_cache.sql](../backend/migrations/0001_init_favorites_and_provider_cache.sql).

### 3. Переменные окружения

**Backend** — скопируйте [../backend/.env.example](../backend/.env.example) в `backend/.env`:

```env
PORT=4000
CORS_ORIGIN=http://127.0.0.1:3000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWKS_URL=https://xxxx.supabase.co/auth/v1/.well-known/jwks.json
CACHE_TTL_SECONDS=86400
OSM_USER_AGENT=nearstep-hw5-backend/0.1 (contact: you@example.com)
```

**Frontend** — скопируйте [../frontend/.env.example](../frontend/.env.example) в `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4000
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

> **Важно:** `SUPABASE_SERVICE_ROLE_KEY` никогда не добавляйте в `NEXT_PUBLIC_*`.

### 4. Запуск

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (другой терминал)
cd frontend && npm install && npm run dev
```

Проверка: `curl http://127.0.0.1:4000/api/health` → `{ "ok": true }`  
Приложение: http://127.0.0.1:3000

### 5. Smoke-тест API

```bash
cd backend && npm run smoke
```

---

## API endpoints

Базовый URL: `http://127.0.0.1:4000`. Все ответы — JSON.

### Формат ошибок

```json
{ "error": { "message": "Описание", "kind": "VALIDATION" } }
```

| kind | HTTP | Когда |
|------|------|-------|
| `VALIDATION` | 400 | Невалидные параметры |
| `UPSTREAM` | 502 | OSM-провайдер недоступен |
| `UNKNOWN` | 401, 404, 500 | Auth, not found, internal |

### Публичные endpoints

| Метод | Путь | Описание | Request | Response |
|-------|------|----------|---------|----------|
| GET | `/api/health` | Healthcheck | — | `{ ok: true }` |
| GET | `/api/categories` | Список категорий POI | — | `CategoryDTO[]` |
| GET | `/api/locations/search` | Поиск локации | `?q=строка` | `LocationSuggestionDTO[]` |
| GET | `/api/pois` | POI рядом с точкой | `?by=nearby&lat=&lng=&radiusMeters=&categoryIds=` | `PoiDTO[]` |
| GET | `/api/pois/:id` | POI по id | — | `PoiDTO` или 404 |
| POST | `/api/routes/build` | Варианты маршрута | `{ start, pois[], targetDistanceKm, maxVariants? }` | `RouteVariantDTO[]` |

### Защищённые endpoints (Bearer JWT)

| Метод | Путь | Описание | Response |
|-------|------|----------|----------|
| GET | `/api/favorites` | Список избранного | `FavoritesEntryDTO[]` |
| POST | `/api/favorites` | Добавить запись | `{ ok: true }` |
| DELETE | `/api/favorites/:id` | Удалить по id | `{ ok: true }` |
| POST | `/api/favorites/sync` | Массовая синхронизация | `{ imported, skipped }` |

Заголовок: `Authorization: Bearer <supabase_access_token>`.

### Примеры curl

Полный набор: [api_request_examples.md](api_request_examples.md).

---

## Безопасность

### Аутентификация

- Frontend: Supabase Auth (`signInWithPassword`, `signUp`) → access token в сессии.
- Backend: проверка JWT через JWKS ([../backend/src/api/middleware/auth.ts](../backend/src/api/middleware/auth.ts)).
- Без токена или с невалидным токеном — **401**.

### Row Level Security

- `favorites`: policies SELECT/INSERT/DELETE только для `authenticated` с `user_id = auth.uid()`.
- `provider_cache`: RLS без policies — блокирует доступ через Data API.

### Разделение ключей

| Ключ | Где используется |
|------|------------------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend (Auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | Только backend `.env` |
| JWT access token | Frontend → Backend (Authorization header) |

### CORS

Настроен в [../backend/src/index.ts](../backend/src/index.ts): `origin: CORS_ORIGIN` (по умолчанию `http://127.0.0.1:3000`).

---

## Обработка ошибок и логирование

### Backend

- Валидация входа — zod → 400 `VALIDATION`.
- Ошибки OSM — try/catch → 502 `UPSTREAM`, лог `req.log.error`.
- Необработанные ошибки — глобальный `setErrorHandler` → 500 `UNKNOWN`.
- Fastify logger (`logger: true`) пишет в stdout при `npm run dev`.

### Frontend

- `HttpNavigatorDataSource` бросает `ApiError` с `kind` и `status`.
- Страницы catalog, location, route/results показывают сообщение пользователю.

### Supabase Logs

Supabase Dashboard → **Logs** → фильтры Auth / Postgres — для отладки RLS, failed login, SQL-ошибок.

### Пример отладки с AI

**Симптом:** `502 Провайдер временно недоступен` при поиске POI.

1. Backend log: `overpass nearby failed` + stack trace.
2. Проверить `OSM_USER_AGENT`, rate limit Overpass.
3. Повторить запрос — если есть cache hit в `provider_cache`, ответ вернётся без OSM.
4. Передать лог AI-агенту для анализа timeout / malformed query.

**Симптом:** e2e-тесты получают «чужие» POI (реальный OSM вместо mock).

1. В e2e backend запускается с `CI=true` и `OSM_MOCK=1`.
2. Кэш `provider_cache` не используется в mock-режиме — иначе отдаётся закэшированный ответ от реального Overpass.
3. См. `backend/src/api/routes/pois.ts` и `locations.ts`.

---

## Процесс разработки с AI

Разработка велась поэтапно с Cursor AI. Промпты сохранены в [prompts/](prompts/).

| Этап | Файл | Что сгенерировано AI |
|------|------|----------------------|
| 0 | `prompt_stage0_prereqs.md` | Чеклист Supabase, env, SQL |
| 1 | `prompt_stage1.md` | Каркас Fastify, healthcheck, структура папок |
| 2 | `prompt_stage2.md` | SQL-миграция, RLS policies |
| 3 | `prompt_stage3.md` | Nominatim, Overpass, provider_cache |
| 4 | `prompt_stage4.md` | POST `/api/routes/build`, route-builder |
| 5 | `prompt_stage5.md` | JWT middleware, favorites repo и routes |
| 6 | `prompt_stage6.md` | HttpNavigatorDataSource, удаление mock |
| 7 | `prompt_stage7.md` | Playwright: два webServer, OSM mock для CI |

### Примеры промптов

**SQL-схема (Stage 2):**
> Подготовить SQL для Supabase: таблицы favorites и provider_cache, RLS на favorites, индексы.

**API routes (Stage 3):**
> Реализовать GET /api/locations/search и GET /api/pois с cache-aside в provider_cache, zod-валидация.

**Интеграция frontend (Stage 6):**
> Заменить mock NavigatorDataSource на HTTP-клиент к backend, sync избранного при логине.

Подробный отчёт: [report/development_report.md](report/development_report.md).
