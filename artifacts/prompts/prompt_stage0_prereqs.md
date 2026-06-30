## Stage 0 — Prereqs: Supabase проект, Auth, ключи, SQL, окружение

### Цель
Подготовить всё необходимое “вне кода”, чтобы backend и frontend могли безопасно работать с:
- **Supabase Auth** (email+password)
- **Supabase Postgres** (избранное + кэш провайдера)
- **OSM провайдерами** (Nominatim + Overpass) через backend

И чтобы агент мог дальше реализовывать этапы 1..7 без блокеров.

---

## 0.1. Создать Supabase Project
1. Создайте новый проект в Supabase (регион — любой).
2. Дождитесь, пока база будет готова.

### Что понадобится из настроек проекта
Дальше потребуются:
- **Project URL** (например `https://xxxx.supabase.co`)
- **Publishable (public/anon) key** — только для фронта (или публичных операций)
- **Service role key** — только для backend (никогда не в браузер)
- **JWKS URL** для проверки JWT на backend

---

## 0.2. Включить Email/Password Auth
В Supabase включите Auth провайдер **Email** (email+password).

### Тестовый пользователь (для e2e и ручной проверки)
Создайте пользователя:
- email: `test@example.com` (или ваш)
- password: (любой безопасный)

Запишите эти значения (в `.env` для тестов).

---

## 0.3. Определить секреты и переменные окружения

### Backend (`backend/.env`)
Список обязательных переменных (значения подставляете из проекта Supabase):

- `PORT=4000`
- `CORS_ORIGIN=http://127.0.0.1:3000`

- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`  **(только backend)**

- `SUPABASE_JWKS_URL=...`  
  Пример формата (зависит от Supabase): JWKS endpoint проекта, который отдаёт публичные ключи для проверки access_token.

- `CACHE_TTL_SECONDS=86400` (24 часа)

- `OSM_NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org`
- `OSM_OVERPASS_BASE_URL=https://overpass-api.de/api/interpreter`
- `OSM_USER_AGENT=nearstep-hw5-backend/0.1 (contact: you@example.com)`  
  Важно: публичные OSM-инстансы ожидают корректный User-Agent.

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4000`

Если фронт будет напрямую работать с Supabase Auth (рекомендуется):
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...` **(публичный ключ)**

> Критично: **никогда** не добавлять `SUPABASE_SERVICE_ROLE_KEY` в `NEXT_PUBLIC_*` переменные.

---

## 0.4. Применить SQL-схему в Supabase

### Таблица `favorites`
Требования:
- хранит избранное пользователя
- доступ строго “только своё” (RLS)
- payload хранится как `jsonb` (минимум автоматизации в БД)

### Таблица `provider_cache`
Требования:
- key/value кэш на TTL для Nominatim/Overpass
- должен использоваться только backend (service role)

### SQL (заготовка для применения)
Сохраните этот SQL в миграцию или примените через SQL Editor Supabase:

```sql
-- favorites: per-user saved items
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('poi', 'route')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists favorites_user_created_at_idx on public.favorites (user_id, created_at desc);
create index if not exists favorites_user_type_idx on public.favorites (user_id, type);

alter table public.favorites enable row level security;

-- Policies: user can access only own rows
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
on public.favorites
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites
for delete
to authenticated
using (user_id = auth.uid());

-- provider_cache: cache for external providers (used only by backend service role)
create table if not exists public.provider_cache (
  cache_key text primary key,
  provider text not null,
  kind text not null,
  request jsonb not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists provider_cache_expires_at_idx on public.provider_cache (expires_at);
```

#### Замечания по безопасности
- `provider_cache` не должен быть доступен клиенту. Держите доступ к нему только на backend через **service role key**.
- Если вы когда-либо дадите доступ “через Data API”, включите RLS и не создавайте permissive policies.

---

## 0.5. Проверки (быстрый чеклист)
Перед переходом к Stage 1 убедитесь:
- Supabase проект создан и доступен.
- Email/password auth включён.
- Тестовый пользователь создан (или есть способ создать в автоматизации).
- SQL таблицы созданы, RLS на `favorites` включён, policies применены.
- Локальные `.env` подготовлены (backend и frontend), секреты не коммитятся.

---

## 0.6. Решение по деталям (фиксируем для реализации)
Для реализации дальнейших этапов принять по умолчанию:
- Nearby радиус: фронт задаёт `radiusMeters`, backend валидирует и может ограничивать.
- `GET /api/pois/:id` нужен (для карточки POI, чтобы убрать `mockData` и `generateStaticParams`).
- Синхронизация избранного после логина: endpoint `POST /api/favorites/sync`.
