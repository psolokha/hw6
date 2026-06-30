# Шаг 7. Настройка логирования

## Итог

Шаг 7 выполнен: backend пишет структурированные JSON-логи с уровнями и redact секретов/PII; хранение — Vercel Runtime Logs; в документации — промпты и образцы для AI-анализа.

## Что сделано

- **Модуль логирования** (`backend/src/core/logger.ts`, `backend/src/core/log-sanitize.ts`):
  - Pino через Fastify, формат NDJSON;
  - уровни `info` / `warn` / `error` (настраиваются через `LOG_LEVEL`);
  - поля `service`, `env`, `commit`, `event`, `req.id` (`x-request-id`);
  - redact: Authorization, Cookie, password, token, email и др.
- **Интеграция в app** (`backend/src/app.ts`):
  - кастомный hook `onResponse` с `event: http_request` и `responseTimeMs`;
  - отключён дублирующий request log Fastify.
- **Доменные события** в маршрутах: `nominatim_search_failed`, `overpass_nearby_failed`, `auth_failed`, `favorites_list_failed` и др.
- **Документация**: секция «Логирование» в `integration_documentation.md`.
- **AI-анализ**: 4 промпта + таблица результатов на `artifacts/hw6/log-samples/sample-errors.jsonl`.
- **Env**: `LOG_LEVEL` в `backend/.env.example`.

## Проверки

```bash
npm run format:check && npm run lint
npm --prefix backend run typecheck && npm --prefix backend run build
npm run test:e2e   # 23 passed
```

Локально: `cd backend && npm run dev` → `curl http://127.0.0.1:4000/api/health` — в терминале JSON с `event: http_request`.

Prod: Vercel → `hw6-backend` → **Logs**.

## Решения и компромиссы

- **Централизованное хранение** — Vercel Runtime Logs (бесплатно, без отдельного ELK/Datadog на Hobby).
- **Frontend** не логирует на сервере структурированно — фокус на API; клиентские ошибки остаются в браузере / Vercel Analytics.
- **Поисковые запросы OSM** в логах не сохраняются целиком — только `queryLength`, чтобы не копить PII/лишние данные.
- **userId** (UUID) в ошибках favorites — для корреляции инцидентов без email.

## Что потребовало участия пользователя

- Не потребовало. Для просмотра prod-логов: Vercel Dashboard → проект backend → Logs.
