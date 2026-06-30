# Отчёт по аудиту безопасности (HW6)

**Дата:** 2025-06-30 · **Инструменты:** `npm audit`, OWASP-обзор кода, AI security-review.

## Резюме

| | До | После |
|---|-----|-------|
| High+ в зависимостях | 1 (Next.js 16.2.0) | 0 |
| Проблемы в коде | 8 находок | 6 исправлено, 2 — рекомендации |
| CI | без audit | `npm audit --audit-level=high` в job `quality` |

## Зависимости

- **Исправлено:** `next@16.2.9` (CVE high в App Router/RSC).
- **Принят риск:** transitive PostCSS (moderate) — ждём патч upstream; `esbuild` (low, dev-only).

## Находки и исправления (код)

| Область | Проблема | Действие |
|---------|----------|----------|
| XSS | `externalUrl` из OSM | `safe-url.ts` на backend + frontend |
| Headers | нет CSP/helmet | `next.config.mjs`, `@fastify/helmet` |
| DoS | нет rate limit, большие body | rate-limit 120/min, `bodyLimit` 256KB |
| Injection | произвольные `categoryIds` | whitelist из `CATEGORIES` |
| Abuse | неограниченный sync favorites | max 200 записей; routes build max 30 POI |
| Auth | — | JWT через JWKS, favorites по `user_id` (уже было) |
| CSRF | — | Bearer JWT, не cookie-сессии (низкий риск) |
| Секреты | — | service role только backend, `.env` в gitignore |

## Изменённые файлы

`frontend/package.json`, `next.config.mjs`, `lib/safe-url.ts`, `poi-detail-client.tsx`; `backend/src/app.ts`, `safe-url.ts`, routes (`pois`, `routes`, `favorites`), OSM providers; `.github/workflows/ci.yml`.

## Рекомендации (не блокируют сдачу)

1. Следить за `npm audit`, обновлять Next.js.
2. Убрать `typescript.ignoreBuildErrors` после исправления TS.
3. Проверить RLS на `favorites` в Supabase.
4. При росте нагрузки — edge rate limit / WAF (Vercel Pro).

## Проверки

```bash
npm audit --audit-level=high   # frontend + backend
npm run test:e2e             # 27 passed
```
