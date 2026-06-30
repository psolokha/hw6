## Stage 2 — Supabase schema (favorites + provider_cache) + RLS

### Цель
Подготовить SQL (миграцию) для Supabase:
- `public.favorites` с RLS и политиками
- `public.provider_cache` для кэша провайдера с TTL

### Требования
- `favorites` привязана к `auth.users(id)`
- Политики RLS: пользователь видит/создаёт/удаляет только свои записи
- `provider_cache` недоступен клиентам (используется backend через service role)

### Что сделать
1. Сгенерировать SQL для таблиц.
2. Включить RLS на `favorites`, создать policies для SELECT/INSERT/DELETE (и UPDATE при необходимости).
3. Индексы:
   - favorites: `(user_id, created_at desc)`, `(user_id, type)`
   - provider_cache: `(expires_at)`
4. Описать в backend README переменные окружения:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWKS_URL`

### Важно (безопасность Supabase)
- Не использовать `user_metadata` для авторизационных решений.
- Не хранить `service_role` ключ нигде, кроме backend.
