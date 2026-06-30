## Stage 3 — OSM provider: Nominatim + Overpass + caching

### Цель
Реализовать публичные API:
- `GET /api/locations/search?q=...`
- `GET /api/pois?by=nearby&lat=&lng=&radiusMeters=&categoryIds=...`
- `GET /api/pois/:id` (минимально через повторный запрос/кэш)

И подключить кэширование ответов провайдера в Supabase (`provider_cache`) с TTL.

### Требования
- Nominatim:
  - запрос по строке `q`
  - нормализация в `LocationSuggestionDTO[]` (id, title, subtitle?, center?)
- Overpass:
  - запрос POI вокруг точки в радиусе
  - нормализация в `PoiDTO[]` (id, title, description?, categories[], location, photoUrl?, externalUrl?)
- Кэш:
  - cache key = kind + основные параметры + округление координат (чтобы не взрывать ключи)
  - TTL из env (по умолчанию 24h)

### Что сделать
1. Реализовать `providers/osm/nominatim.ts` и `providers/osm/overpass.ts`.
2. Реализовать `db/cache.repo.ts` (get/set).
3. Обернуть вызовы провайдера в "cache-aside": сначала кэш, потом провайдер, затем save.
4. Добавить в API роуты и zod-валидацию query params.
5. Добавить маппинг категорий (OSM tags -> ваши `CategoryDTO` ids).
