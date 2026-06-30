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

-- RLS: включён для защиты от случайного доступа через Data API.
-- Service role ключ на backend обходит RLS и продолжит работать.
alter table public.provider_cache enable row level security;

