---
name: hw6-step
description: >-
  Выполняет шаг домашнего задания HW6 из tasks.md автономно: код, CI/CD, деплой,
  документация, проверки. Вызывать с номером шага («шаг 2», «step 3», «выполни шаг N»).
  Принципы: всё что можно — сам; спрашивать пользователя только при выборе/нет доступа.
disable-model-invocation: true
---

# HW6 — выполнение шага задания

## Вход

Пользователь передаёт **номер шага** (1–9). Если номер не указан — уточни один раз.

1. Прочитай `tasks.md` → секцию **«Шаг N»** (требования и критерии).
2. Прочитай `artifacts/hw6/step{N}.md`, если есть (что уже сделано).
3. Прочитай `integration_documentation.md` (текущее состояние интеграций).
4. Сверься с [steps.md](steps.md) (чеклист шага) и [access-matrix.md](access-matrix.md) (кто что делает).

Отвечай пользователю **на русском**. Имена файлов, команды и код — в оригинале.

## Главный принцип: максимум автономии

```
Сначала сделай сам → если блокер → попробуй обход (API/CLI/MCP) →
если нужны права/регистрация/выбор — спроси пользователя чётко и кратко →
после разблокировки продолжай сам, не возвращай работу пользователю.
```

**Делай сам (не спрашивай):**
- читать/писать код в репозитории;
- запускать команды, тесты, сборки, линт, форматирование;
- настраивать CI (`.github/workflows/`);
- коммитить и пушить по завершении шага (см. «Git и деплой»);
- создавать/мержить PR через GitHub MCP (если прямой push блокируется);
- ставить GitHub Actions secrets через REST API (если PAT с правом `Secrets: Read and write`);
- проверять деплои Vercel MCP, health, CORS, браузером;
- писать/обновлять `artifacts/hw6/step{N}.md`, `integration_documentation.md`, отчёты по шагу;
- удалять устаревшие артефакты (как `render.yaml`), не трогая нужное для Vercel/CI.

**Спрашивай пользователя только когда:**
- нужен **выбор** с разными trade-off (провайдер OAuth, аналитика, платежи, платный хостинг);
- действие **необратимо** и не было в задании (массовое удаление закоммиченных файлов вне `artifacts/`);
- нужна **регистрация/карта** на внешнем сервисе.

**Проси пользователя сделать (дай точные шаги в UI), если нет write-доступа:**
- расширить права PAT (например `Secrets: Read and write`);
- Vercel env / настройки проекта (нет write в Vercel MCP);
- Supabase Auth URL Configuration (Site URL, Redirect URLs);
- консоли OAuth-провайдеров (Client ID/Secret);
- регистрация на сервисах, требующих карту.

После того как пользователь сделал — **продолжай сам**, не пересказывай план.

Подробная матрица: [access-matrix.md](access-matrix.md).

## Ограничения проекта (обязательно)

- **Стек** — только из `.cursor/rules/tech-stack-from-readme.mdc` (Next.js App Router, Fastify, Supabase, Tailwind/shadcn). Альтернативные фреймворки не предлагать.
- **Приложение по умолчанию** — `frontend/` (см. `default-app-is-frontend.mdc`).
- **Не пушить без зелёных тестов** — перед `git push` локально: `npm run test:e2e` (19 тестов). При падении — чини, не пушь.
- **Не менять `git config`** (user.name/email) — деплой Vercel зависит от автора коммита.
- **Не коммитить** `.env`, ключи, токены.
- **Коммиты** — по завершении логической части шага; сообщения на английском, кратко, про «why».

## Git и деплой

### Vercel (текущая схема)

| Проект | Root | Прод URL |
|--------|------|----------|
| `hw6-frontend` | `frontend` | https://hw6-pi-ruddy.vercel.app |
| `hw6-backend` | `backend` | https://hw6-ac72.vercel.app |

- Автодеплой при push в `main`.
- **Git Author Protection**: коммиты должны быть от email, привязанного к аккаунту Vercel (`psolokha`). Иначе деплой `BLOCKED` → мерж PR вместо прямого push.
- Backend на Vercel — serverless (`backend/api/index.ts`, `backend/vercel.json`), не `listen()` в serverless.

### CI (`.github/workflows/ci.yml`)

Джобы: `quality` (Prettier + ESLint) → `frontend` + `backend` (typecheck + build) → `e2e` (Playwright, нужны secrets).

После push проверь CI (GitHub API / Actions) — все джобы `success`, E2E не `skipped` (если секреты на месте).

## Рабочий цикл шага

Скопируй и веди чеклист:

```
Шаг N — прогресс:
- [ ] 1. Прочитать tasks.md + текущие артефакты
- [ ] 2. Составить план (кратко, без лишнего)
- [ ] 3. Реализовать код/конфиг
- [ ] 4. Локальные проверки (typecheck, build, lint, format, e2e)
- [ ] 5. Обновить документацию
- [ ] 6. Создать artifacts/hw6/stepN.md
- [ ] 7. Коммит + push (или PR → merge)
- [ ] 8. Проверить CI + деплой + прод (health / браузер)
- [ ] 9. Отчёт пользователю: что сделано, что осталось у него (если есть)
```

### Локальные проверки (минимум перед push)

```bash
npm run format:check          # корень
npm run lint                  # корень → frontend ESLint
npm --prefix frontend run typecheck && npm --prefix frontend run build
npm --prefix backend run typecheck && npm --prefix backend run build
npm run test:e2e              # 19 passed
```

### Документация по шагу

| Файл | Когда обновлять |
|------|-----------------|
| `artifacts/hw6/step{N}.md` | Всегда — краткий итог шага |
| `integration_documentation.md` | Интеграции, CI/CD, env, деплой |
| `security_audit.md` | Шаг 2 и правки безопасности |
| `README.md` | Шаг 9 |

Шаблон `artifacts/hw6/step{N}.md`:

```markdown
# Шаг N. [название из tasks.md]

## Итог
[1–2 предложения: выполнено / частично / блокер]

## Что сделано
- ...

## Проверки
- [команды, URL, CI run, E2E]

## Решения и компромиссы
- ...

## Что потребовало участия пользователя
- ... (или «не потребовало»)
```

## GitHub Actions secrets

Если E2E пропускается — секреты не заданы. Значения брать из `backend/.env` и `frontend/.env.local` (не коммитить, не логировать).

Список: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWKS_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`.

Установка: GitHub REST API + libsodium sealed-box (PAT с `Secrets: Read and write`). Скрипт: [scripts/set-github-secrets.mjs](scripts/set-github-secrets.mjs).

```bash
cd .cursor/skills/hw6-step/scripts
npm init -y && npm install libsodium-wrappers
node set-github-secrets.mjs
```

## MCP и инструменты

| Сервер | Использовать для |
|--------|------------------|
| `user-github` | PR, merge, файлы, commits; secrets через API |
| `user-vercel` | статус деплоев, проекты (read); env — только вручную пользователем |
| `plugin-supabase-supabase` | БД, миграции, логи; Auth URL — вручную |
| `cursor-ide-browser` | сквозная проверка фронт→бэк, CORS |
| `user-context7` / `find-docs` | актуальная документация библиотек |

Если `gh` / `vercel` / `supabase` CLI не установлены — работай через MCP и Node-скрипты, не проси пользователя ставить CLI без необходимости.

## Эталон: Шаг 1 (уже выполнен)

См. `artifacts/hw6/step1.md` — образец полноты отчёта. Ключевые уроки:
- Fastify → Vercel serverless handler (не `listen()`).
- CORS: нормализация trailing slash.
- `frontend/lib/backend-url.ts` — prod-fallback для backend URL.
- Отдельная CI-джоба `quality` (Prettier + ESLint).
- Удалён `render.yaml` (неиспользуемый blueprint).

## Шаги 2–9

Краткие чеклисты и артефакты: [steps.md](steps.md).

При старте шага N>1 — не повторяй работу предыдущих шагов; опирайся на уже настроенный CI/CD и деплой.

## Как вызывать скилл

Пользователь пишет, например:
- «выполни шаг 2»
- «@hw6-step шаг 3»
- «сделай шаг 2 из tasks.md»

Агент: прочитать этот SKILL.md → номер шага → `tasks.md` + `steps.md` → работать по циклу выше.

## Финальный отчёт пользователю

После шага дай структурированно:
1. **Статус** — готов / частично / заблокирован.
2. **Что сделано** — код, конфиги, доки, CI.
3. **Проверки** — локальные + CI run + прод URL.
4. **От пользователя** — только если осталось (права, консоль, URL в Supabase и т.д.).
5. **Следующий шаг** — одной строкой, без навязывания.
