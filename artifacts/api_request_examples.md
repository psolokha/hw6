# Примеры запросов к API

Базовый URL: `http://127.0.0.1:4000`.

## Healthcheck

```bash
curl http://127.0.0.1:4000/api/health
```

## Категории

```bash
curl http://127.0.0.1:4000/api/categories
```

## Поиск локации

```bash
curl "http://127.0.0.1:4000/api/locations/search?q=Moscow"
```

## POI рядом с точкой

`radiusMeters` — радиус в метрах; `categoryIds` через запятую — опционально.

```bash
curl "http://127.0.0.1:4000/api/pois?by=nearby&lat=55.7558&lng=37.6176&radiusMeters=1500&categoryIds=cafe,museum"
```

## POI по id

```bash
curl "http://127.0.0.1:4000/api/pois/node%2F123456789"
```

## Построение маршрута

```bash
curl -X POST http://127.0.0.1:4000/api/routes/build \
  -H "Content-Type: application/json" \
  -d '{
    "start": { "lat": 55.7558, "lng": 37.6176 },
    "targetDistanceKm": 5,
    "maxVariants": 3,
    "pois": [
      { "id": "p1", "title": "POI 1", "categories": ["cafe"],   "location": { "lat": 55.758, "lng": 37.620 } },
      { "id": "p2", "title": "POI 2", "categories": ["museum"], "location": { "lat": 55.760, "lng": 37.615 } },
      { "id": "p3", "title": "POI 3", "categories": ["park"],   "location": { "lat": 55.753, "lng": 37.610 } }
    ]
  }'
```

## Список избранного

```bash
curl http://127.0.0.1:4000/api/favorites \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

## Добавление POI в избранное

```bash
curl -X POST http://127.0.0.1:4000/api/favorites \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "poi",
    "id": "p1",
    "createdAtIso": "2026-05-22T08:00:00.000Z",
    "poi": { "id": "p1", "title": "POI 1", "categories": ["cafe"], "location": { "lat": 55.758, "lng": 37.620 } }
  }'
```

## Удаление из избранного

```bash
curl -X DELETE http://127.0.0.1:4000/api/favorites/p1 \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

## Синхронизация избранного с клиента

Массив записей:

```bash
curl -X POST http://127.0.0.1:4000/api/favorites/sync \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "type": "poi",
      "id": "p1",
      "createdAtIso": "2026-05-22T08:00:00.000Z",
      "poi": { "id": "p1", "title": "POI 1", "categories": ["cafe"], "location": { "lat": 55.758, "lng": 37.620 } }
    }
  ]'
```
