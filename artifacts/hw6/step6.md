# Шаг 6. Настройка мониторинга

## Итог

Шаг 6 выполнен: расширенные Health Check endpoints (БД, auth, backend reachability), мониторинг prod через GitHub Actions cron + Vercel Analytics.

## Что сделано

- **Backend health** (`backend/src/core/health-checks.ts`, `backend/src/api/routes/health.ts`):
  - ping Supabase (`provider_cache`);
  - проверка Supabase JWKS;
  - опционально Nominatim `/status.php` (не блокирует `ok`);
  - HTTP **503** при недоступности критичных зависимостей.
- **Frontend health** (`frontend/app/api/health/route.ts`):
  - проверка доступности backend `/api/health`.
- **Мониторинг prod**: `.github/workflows/uptime-monitor.yml` — cron каждые 15 мин, curl prod URL + jq-валидация.
- **E2E**: обновлён smoke-тест backend health; добавлен тест frontend `/api/health`.
- **Документация**: секции «Health Check» и «Мониторинг» в `integration_documentation.md`.

## Проверки

```bash
npm run format:check && npm run lint
npm --prefix frontend run typecheck && npm --prefix frontend run build
npm --prefix backend run typecheck && npm --prefix backend run build
npm run test:e2e
```

Prod (после деплоя):

- `GET https://hw6-ac72.vercel.app/api/health` → `ok: true`, `checks.database` / `checks.auth` = `ok`
- `GET https://hw6-pi-ruddy.vercel.app/api/health` → `ok: true`, `checks.backend` = `ok`
- GitHub Actions → **Production uptime monitor** → Run workflow
