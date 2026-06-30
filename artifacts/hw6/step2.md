# Шаг 2. Аудит безопасности

## Итог

Шаг 2 выполнен: проведён аудит зависимостей и кода, критичные и средние находки исправлены, подготовлен `security_audit.md`, в CI добавлен `npm audit`. E2E **19/19 passed**.

## Что сделано

- **Зависимости:** `npm audit` frontend + backend; Next.js обновлён `16.2.0` → `16.2.9` (устранены high CVE).
- **Код (OWASP):**
  - Security headers на frontend (CSP, X-Frame-Options, nosniff, Referrer-Policy).
  - Backend: `@fastify/helmet`, `@fastify/rate-limit` (120/min), `bodyLimit` 256KB, уточнён CORS.
  - XSS: санитизация `externalUrl` (только http/https) на backend и frontend.
  - Injection/DoS: Zod-лимиты на `/api/routes/build`, whitelist `categoryIds`, лимит sync избранного (200).
- **CI:** job `quality` — `npm audit --audit-level=high` для frontend и backend.
- **Документация:** `security_audit.md`, секция безопасности в `integration_documentation.md`.

## Проверки

```bash
npm run format:check && npm run lint
npm --prefix frontend run typecheck && npm --prefix frontend run build
npm --prefix backend run typecheck && npm --prefix backend run build
npm audit --audit-level=high  # в frontend/ и backend/
npm run test:e2e              # 19/19 passed
```
