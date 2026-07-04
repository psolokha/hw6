# Матрица доступа: агент vs пользователь

## Полностью автономно (агент)

| Область | Действия |
|---------|----------|
| Код | frontend/, backend/, tests/, CI yaml, конфиги линтера |
| Git | ветки, коммиты, push, PR create/merge (GitHub MCP) |
| Тесты | typecheck, build, lint, format:check, test:e2e локально |
| CI | правки workflow, проверка runs через GitHub API |
| Secrets | запись в GitHub Actions (PAT + `Secrets: Read and write`) |
| Деплой-мониторинг | Vercel MCP: list/get deployments, health curl |
| Браузер | CORS, сквозные запросы фронт→бэк |
| Supabase (частично) | SQL, миграции, edge functions, логи, advisors |
| Документация | artifacts/hw6/, integration_documentation.md, security_audit.md |
| Очистка | удаление неиспользуемых файлов (render.yaml и т.п.) |

## Спросить пользователя (выбор / мнение)

| Ситуация | Пример |
|----------|--------|
| Выбор провайдера | Google vs Yandex OAuth; Метрика vs GA |
| Платный хостинг | если бесплатный tier не подходит |
| Опциональный шаг 5 | платежи — делать или пропустить |
| Необратимое удаление | массовое удаление закоммиченного вне artifacts/ |

## Попросить пользователя (нет write-доступа)

| Где | Что сделать | После — агент продолжает сам |
|-----|-------------|------------------------------|
| GitHub PAT | `Secrets: Read and write`, `Pull requests`, repo access | залить secrets, проверить CI |
| Vercel Dashboard | env vars, Git Author Protection off (если нужно) | redeploy, verify health |
| Supabase Dashboard | Auth → URL Configuration (Site URL, Redirect URLs) | проверить логин на проде |
| OAuth консоль | создать app, Client ID/Secret, redirect URIs | вшить в env, реализовать flow |
| Аналитика | счётчик, ID счётчика | вставить код, проверить события |
| Регистрация сервиса | аккаунт, API key (если нет MCP) | интеграция в код |

## Нельзя агенту

| Запрет | Причина |
|--------|---------|
| `git config` user.name/email | ломает/чинит Vercel Git Author Protection |
| Коммит `.env`, токенов | безопасность |
| Push без зелёного `test:e2e` | правило проекта |
| Force push main | правило проекта |
| Альтернативные фреймворки | tech-stack rule |

## Обход блокеров (порядок)

1. **Vercel BLOCKED** — проверить `githubCommitAuthorLogin` в деплое; если не `psolokha` → PR+merge или попросить выровнять git email (пользователь сам, не агент).
2. **E2E skipped в CI** — нет secrets → API set secrets из локальных .env.
3. **403 на secrets API** — попросить `Secrets: Read and write` на PAT.
4. **Нет Vercel env write** — код-fallback (как `backend-url.ts`) или инструкция пользователю; предпочти код-fallback где уместно.
5. **CLI отсутствует** — Node-скрипт + fetch API, не останавливаться.
