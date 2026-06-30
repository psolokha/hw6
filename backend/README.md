# Backend (NearStep)

## Запуск

```bash
cd backend
npm install
cp .env.example .env   # заполните значения из Supabase
npm run dev
```

Healthcheck:

```bash
curl http://127.0.0.1:4000/api/health
```

Smoke-тест API:

```bash
npm run smoke
```

## Supabase: миграция

1. Откройте Supabase Dashboard → **SQL Editor**.
2. Выполните SQL из [`migrations/0001_init_favorites_and_provider_cache.sql`](migrations/0001_init_favorites_and_provider_cache.sql).
3. Убедитесь, что на таблице `favorites` включён RLS и созданы policies.

Подробная инструкция: [backend_documentation.md](../artifacts/backend_documentation.md).

## Переменные окружения

См. `.env.example`.

### Обязательные

| Переменная | Описание |
|------------|----------|
| `PORT` | Порт backend (по умолчанию 4000) |
| `CORS_ORIGIN` | Origin фронта, например `http://127.0.0.1:3000` |
| `SUPABASE_URL` | URL проекта Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Только backend**, никогда не попадать в браузер |
| `SUPABASE_JWKS_URL` | JWKS endpoint для проверки JWT |

**Формат `SUPABASE_JWKS_URL`:**

```
https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
```

Подставьте свой project ref из `SUPABASE_URL`.

### Опциональные

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `CACHE_TTL_SECONDS` | 86400 | TTL кэша провайдера (сек) |
| `OSM_NOMINATIM_BASE_URL` | nominatim.openstreetmap.org | Nominatim |
| `OSM_OVERPASS_BASE_URL` | overpass-api.de | Overpass |
| `OSM_USER_AGENT` | — | User-Agent для публичных OSM-инстансов |
| `OSM_MOCK` | — | `1` — mock OSM вместо реальных запросов |

### Для E2E и ручной проверки auth

Создайте пользователя в Supabase Dashboard → Authentication → Users (или через UI регистрации приложения):

| Переменная | Пример |
|------------|--------|
| `TEST_USER_EMAIL` | `test@example.com` |
| `TEST_USER_PASSWORD` | ваш пароль |

Эти переменные используются e2e-тестом `tests/e2e/auth-favorites.spec.ts`.
