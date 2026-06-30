## Stage 1 — Backend scaffold (TS + HTTP server)

### Цель
Создать рабочий каркас `backend/` с TypeScript, dev-скриптами, базовой структурой слоёв и healthcheck.

### Требования
- Папка: `/backend`
- TypeScript, Node LTS
- HTTP сервер (Fastify или Express), CORS для `http://127.0.0.1:3000`
- Структура директорий: `src/api`, `src/core`, `src/providers`, `src/db`
- `.env.example` с нужными переменными (Supabase + OSM + TTL)
- Endpoint: `GET /api/health` -> `{ ok: true }`

### Что сделать
1. Создать `backend/package.json`, `tsconfig.json`.
2. Добавить зависимости: сервер, zod, dotenv, logger (по минимуму).
3. Создать `src/index.ts` и поднять сервер на `PORT`.
4. Создать роут `GET /api/health`.
5. Убедиться, что сервер стартует.

### Ограничения безопасности
- Не добавлять реальные ключи в репозиторий.
- Service role ключ использовать только на бэке (в env без `NEXT_PUBLIC_`).
