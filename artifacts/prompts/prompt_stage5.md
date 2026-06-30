## Stage 5 — Favorites (Supabase Auth JWT) + guest sync

### Цель
Реализовать избранное:
- гость: остаётся локально на фронте
- авторизованный: хранится на сервере (Supabase)

### Endpoints
- `GET /api/favorites` (auth)
- `POST /api/favorites` (auth) принимает `FavoritesEntryDTO`
- `DELETE /api/favorites/:id` (auth)
- `POST /api/favorites/sync` (auth) принимает массив локальных entries и возвращает статистику

### Требования
- Auth middleware:
  - принимает `Authorization: Bearer <supabase_access_token>`
  - валидирует JWT по JWKS
  - извлекает `user_id` (sub)
- DB repo:
  - `favorites.repo.ts`: list/add/remove, дедупликация (по `payload.poi.id` или `payload.route.id`)
- RLS в Supabase должен защищать таблицу даже при случайном доступе через Data API.

### Что сделать
1. Реализовать `api/middleware/auth.ts`.
2. Реализовать `db/favorites.repo.ts`.
3. Реализовать роуты `api/routes/favorites.ts`.
4. Добавить интеграционный smoke test (опционально).
