# Отчёт по аудиту безопасности (HW6, Шаг 2)

**Дата:** 2025-06-30  
**Инструменты:** `npm audit`, ручной обзор кода (OWASP Top 10), AI-анализ (Cursor Agent / security-review workflow).

## Резюме

| Категория | До аудита | После исправлений |
|-----------|-----------|-------------------|
| Уязвимости зависимостей (high+) | 1 high (Next.js 16.2.0) | 0 high |
| Уязвимости зависимостей (moderate) | transitive PostCSS в Next.js | принят риск, мониторинг |
| Проблемы в коде | 8 находок | исправлено 6, 2 — рекомендации |
| CI | без проверки зависимостей | `npm audit --audit-level=high` в job `quality` |

## 1. Аудит зависимостей

### Frontend (`frontend/`)

```bash
npm audit
```

| Пакет | Severity | Описание | Действие |
|-------|----------|----------|----------|
| `next@16.2.0` | **high** | Множественные CVE (DoS RSC, middleware bypass, XSS в App Router) | **Исправлено:** обновление до `16.2.9` |
| `postcss` (transitive через `next`) | moderate | XSS в CSS stringify (GHSA-qx2v-qp2m-jg93) | **Принят риск:** исправление только через downgrade Next; ждём патч upstream |

### Backend (`backend/`)

| Пакет | Severity | Описание | Действие |
|-------|----------|----------|----------|
| `esbuild` (transitive через `tsx`, dev) | low | Чтение файлов в dev-сервере на Windows (GHSA-g7r4-m6w7-qqqr) | **Принят риск:** только dev-зависимость, не в production |

### CI

В `.github/workflows/ci.yml` добавлены шаги:

- `npm audit --audit-level=high` для `frontend/` и `backend/`
- Пайплайн падает только при high/critical; moderate/low документированы

## 2. Обзор кода (OWASP Top 10)

### A01 Broken Access Control

| Находка | Severity | Статус |
|---------|----------|--------|
| `/api/favorites` без JWT → 401 | — | **Уже было:** `requireUserIdFromBearer`, scope по `user_id` в репозитории |
| Service role key только на backend | — | **Уже было:** ключ не в `NEXT_PUBLIC_*` |

### A02 Cryptographic Failures / A07 Identification and Authentication

| Находка | Severity | Статус |
|---------|----------|--------|
| JWT верификация через JWKS Supabase | — | **Уже было:** `jose` + issuer check |
| Секреты в репозитории | — | **Уже было:** `.env` в `.gitignore` |

### A03 Injection

| Находка | Severity | Статус |
|---------|----------|--------|
| SQL injection | — | **Нет риска:** Supabase client, параметризованные запросы |
| Overpass query injection | low | **Уже было:** координаты — числа через Zod, id — regex |
| Невалидные `categoryIds` в query | medium | **Исправлено:** whitelist из `CATEGORIES` |

### A04 Insecure Design / A05 Security Misconfiguration

| Находка | Severity | Статус |
|---------|----------|--------|
| Нет security headers на frontend | medium | **Исправлено:** CSP, X-Frame-Options, nosniff, Referrer-Policy в `next.config.mjs` |
| Нет security headers на API | medium | **Исправлено:** `@fastify/helmet` |
| CORS `*` / слишком широкий | low | **Уже было:** `CORS_ORIGIN` из env, нормализация |
| Нет rate limiting | medium | **Исправлено:** `@fastify/rate-limit` (120 req/min, health в allowlist) |
| Большие тела запросов | low | **Исправлено:** `bodyLimit: 256KB` |

### A06 Vulnerable and Outdated Components

См. раздел 1 — Next.js обновлён.

### A07 XSS (Cross-Site Scripting)

| Находка | Severity | Статус |
|---------|----------|--------|
| `externalUrl` из OSM → `<a href>` | **high** | **Исправлено:** `sanitizeHttpUrl` на backend + `isSafeHttpUrl` на frontend (только http/https) |
| React text rendering POI title/description | — | **Уже было:** экранирование React |
| `dangerouslySetInnerHTML` | — | **Не используется** |

### A08 CSRF

| Находка | Severity | Статус |
|---------|----------|--------|
| API auth через Bearer JWT | — | **Низкий риск CSRF:** токен в заголовке, не в cookie; Same-Origin Policy для custom headers |

### A09 DoS / Resource exhaustion

| Находка | Severity | Статус |
|---------|----------|--------|
| `/api/favorites/sync` без лимита | medium | **Исправлено:** max 200 записей |
| `/api/routes/build` без лимита POI | low | **Исправлено:** max 30 POI, лимиты строк |
| Rate limiting публичных API | medium | **Исправлено:** см. выше |

### A10 SSRF

| Находка | Severity | Статус |
|---------|----------|--------|
| Исходящие запросы к OSM | low | **Контролируется:** URL из env (`OSM_*_BASE_URL`), пользовательский ввод только в query params к доверенным API |

## 3. Внесённые изменения в код

| Файл | Изменение |
|------|-----------|
| `frontend/package.json` | `next@16.2.9`, `eslint-config-next@16.2.9` |
| `frontend/next.config.mjs` | Security headers (CSP, X-Frame-Options, …) |
| `frontend/lib/safe-url.ts` | Валидация http(s) URL на клиенте |
| `frontend/app/(planner)/poi/[id]/poi-detail-client.tsx` | Безопасный `externalUrl` |
| `backend/src/app.ts` | helmet, rate-limit, body limit, CORS methods/headers |
| `backend/src/core/safe-url.ts` | Санитизация URL на backend |
| `backend/src/api/routes/routes.ts` | Строгая Zod-валидация build payload |
| `backend/src/api/routes/pois.ts` | Whitelist categoryIds |
| `backend/src/api/routes/favorites.ts` | Лимиты длины id/title, max 200 на sync |
| `backend/src/providers/osm/*.ts` | Санитизация `externalUrl` из OSM |
| `.github/workflows/ci.yml` | `npm audit --audit-level=high` |

## 4. Что уже было хорошо

- JWT auth через Supabase JWKS (`jose`), без самописных токенов
- Zod-валидация query/body на публичных эндпоинтах
- Service role key только на backend
- `.env` / секреты не в git
- CORS с явным списком origin
- E2E smoke: 401 на `/api/favorites` без токена и с невалидным JWT

## 5. Рекомендации (не блокируют сдачу)

1. **PostCSS transitive** — обновлять Next.js при выходе патча; периодически `npm audit`.
2. **`typescript.ignoreBuildErrors: true`** в `next.config.mjs` — убрать после исправления TS-ошибок (сейчас маскирует проблемы типизации).
3. **RLS в Supabase** — убедиться, что политики на таблице `favorites` включены (backend использует service role + фильтр `user_id`).
4. **OAuth2 (шаг 3)** — redirect URI whitelist, state parameter, PKCE.
5. **Централизованные логи** — шаг 7: не логировать Authorization и PII.
6. **WAF / DDoS** — на Vercel Hobby ограниченно; при росте нагрузки — Pro + rate limit на edge.

## 6. Проверки после исправлений

```bash
npm run format:check
npm run lint
npm --prefix frontend run typecheck && npm --prefix frontend run build
npm --prefix backend run typecheck && npm --prefix backend run build
npm audit --audit-level=high   # frontend + backend
npm run test:e2e             # 19/19 passed
```

## 7. Использование AI

- Генерация чеклиста и структуры отчёта — skill `hw6-step`
- Анализ кода на OWASP — Cursor Agent (ручной обзор маршрутов, auth, CORS, XSS)
- Предложения по CSP и rate-limit — AI-ассистент с учётом стека Fastify/Next.js
