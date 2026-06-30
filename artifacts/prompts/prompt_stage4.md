## Stage 4 — Route builder on backend

### Цель
Сделать `POST /api/routes/build` который возвращает до 3 вариантов маршрута.

### Вход
```json
{
  "start": { "lat": 0, "lng": 0 },
  "pois": [ /* PoiDTO[] */ ],
  "targetDistanceKm": 10,
  "maxVariants": 3
}
```

### Выход
`RouteVariantDTO[]`

### Требования
- Валидировать:
  - `pois.length >= 3`
  - `targetDistanceKm` в [2..50]
  - `maxVariants` в [1..3]
- Алгоритм:
  - Должен давать 1..3 разных варианта (near/shorter/longer) с детерминированным id.
  - Итоговая длина включает замыкание в старт.
- Ошибки отдавать так, чтобы фронт смог отобразить сообщение без “сырых” HTTP кодов.

### Что сделать
1. Вынести DTO в `backend/src/core/contracts.ts` (совместимые с фронтом).
2. Реализовать `core/route-builder.ts`.
3. Реализовать роут `api/routes/routes.ts` + zod schema.
