# NearStep (HW6)

Планировщик пеших маршрутов: Next.js + Fastify + Supabase.

| Среда | URL |
|-------|-----|
| **Frontend** | https://hw6-pi-ruddy.vercel.app |
| **Backend** | https://hw6-ac72.vercel.app |
| **Репозиторий** | https://github.com/psolokha/hw6 |

## Технологический стек

| Слой | Технологии |
|------|------------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Fastify, TypeScript |
| БД / Auth | Supabase |
| CI/CD | GitHub Actions → Vercel |
| E2E | Playwright |

## Локальный запуск

```bash
# Backend (порт 4000)
cd backend && npm ci && cp .env.example .env   # заполнить Supabase
npm run dev

# Frontend (порт 3000)
cd frontend && npm ci && cp .env.example .env.local
npm run dev
```

Миграция БД: `backend/migrations/0001_init_favorites_and_provider_cache.sql` в Supabase SQL Editor.

## Проверки

```bash
npm run format:check && npm run lint
npm --prefix frontend run typecheck && npm --prefix frontend run build
npm --prefix backend run typecheck && npm --prefix backend run build
npm run test:e2e    # 27 тестов, OSM_MOCK=1
```

Health: `GET /api/health` на backend и frontend.

## Деплой

Два проекта Vercel из одного репо (`frontend/`, `backend/`). Автодеплой при push в `main`. Переменные окружения — см. [integration_documentation.md](integration_documentation.md).

## Документация (сдача ДЗ)

| Файл | Содержание |
|------|------------|
| [integration_documentation.md](integration_documentation.md) | CI/CD, интеграции, мониторинг, логи |
| [security_audit.md](security_audit.md) | Аудит безопасности |
| [artifacts/hw6/](artifacts/hw6/) | Отчёты по шагам 1–9 |
