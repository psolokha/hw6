## Цель
Сделать backend в `/backend` с разделением слоёв **API / Provider / DB**, использовать **OSM (Nominatim + Overpass)** как провайдера, **Supabase Auth** для пользователей и **Supabase Postgres** для хранения избранного и кэша ответов провайдера (TTL). Затем отвязать `frontend/` от моков и подключить к backend.

## Текущее состояние (факты по репозиторию)
- `frontend/` реализован, но использует моки не только через `NavigatorDataSource`, а ещё напрямую в страницах.
- `backend/` пока пустой.
- E2E (Playwright) поднимает только `frontend` на `http://127.0.0.1:3000`.

## Принятые решения
- Провайдер: **OSM** (Nominatim для поиска локаций, Overpass для POI).
- Auth: **Supabase Auth** (email+password).
- Кэш: **да**, хранить в Supabase с TTL (по умолчанию 24 часа).
- Логика построения маршрута: **на backend**.
- Избранное: **гость** — локально в браузере; **авторизованный** — в Supabase.

## Архитектура backend
- API слой: HTTP сервер с валидацией (zod), CORS, auth middleware (JWT Supabase).
- Provider слой: адаптеры `providers/osm/nominatim` и `providers/osm/overpass`.
- Core: DTO/контракты и бизнес-логика (в т.ч. `route-builder`).
- DB слой: supabase admin client + репозитории `favorites` и `provider_cache`.

## Эндпоинты backend (минимальный набор)
Публичные:
- `GET /api/locations/search?q=...` -> `LocationSuggestionDTO[]`
- `GET /api/categories` -> `CategoryDTO[]`
- `GET /api/pois?by=nearby&lat=&lng=&radiusMeters=&categoryIds=...` -> `PoiDTO[]`
- `GET /api/pois?by=location&locationId=...&categoryIds=...` -> `PoiDTO[]` (или преобразование locationId -> центр/радиус)
- `GET /api/pois/:id` -> `PoiDTO | 404`
- `POST /api/routes/build` -> `RouteVariantDTO[]`

Приватные (Bearer token Supabase):
- `GET /api/favorites` -> `FavoritesEntryDTO[]`
- `POST /api/favorites` -> `{ ok: true }` (дедупликация на бэке)
- `DELETE /api/favorites/:id` -> `{ ok: true }`
- (опционально) `POST /api/favorites/sync` -> `{ imported: number, skipped: number }`

## Схема Supabase (минимум в БД)
- `public.favorites`: хранение избранного пользователя (payload jsonb), RLS по `user_id = auth.uid()`.
- `public.provider_cache`: кэш ответов провайдера (key -> response jsonb + expires_at). Доступ только backend через service role.

## План работ (этапы)
### Этап 0 — Prereqs и окружение
- Создать Supabase проект, включить email/password auth.
- Подготовить переменные окружения и тестового пользователя.
- Применить SQL схему (favorites + provider_cache).

### Этап 1 — Каркас backend
- Создать `backend/` (TS проект, сервер, роутинг, CORS, healthcheck).
- Добавить DTO/контракты, совместимые по смыслу с `frontend/data/types.ts`.
- Подготовить `.env.example` (Supabase + OSM + TTL).

### Этап 2 — Supabase (Auth + DB)
- Подготовить SQL для таблиц `favorites` и `provider_cache`.
- Включить RLS на `favorites` и добавить политики.
- Проверить безопасное использование ключей: фронт — public key, backend — service role.

### Этап 3 — Provider слой (OSM)
- Реализовать Nominatim search (locations).
- Реализовать Overpass POI вокруг точки/в радиусе.
- Добавить маппинг OSM tags -> категории приложения.
- Добавить кэширование в `provider_cache` с TTL и ключом запроса.

### Этап 4 — Route Builder на backend
- Реализовать `POST /api/routes/build` (варианты 1..3).
- Перенести/адаптировать идею текущего mock-алгоритма во `core/route-builder`.
- Валидировать вход (>=3 POI, диапазон 2..50 км, maxVariants <=3).

### Этап 5 — Favorites на backend (гость + auth)
- Реализовать protected endpoints favorites.
- Реализовать импорт/merge локальных favorites при логине (sync).

### Этап 6 — Интеграция frontend с backend
- Убрать прямые импорты `@/data/mock/*` из страниц:
  - `route/build`, `route/results`, `poi/[id]`, `favorites`, `popular-routes`.
- Реализовать HTTP-версию `NavigatorDataSource` (например `HttpNavigatorDataSource`), конфиг `BACKEND_URL`.
- Добавить UI логина/логаута (минимально) + переключение избранного (локально/сервер).

### Этап 7 — Тесты и стабилизация
- Обновить Playwright config, чтобы поднимать и frontend, и backend.
- Прогнать `npm run test:e2e`, поправить падения из-за изменения источника данных.
