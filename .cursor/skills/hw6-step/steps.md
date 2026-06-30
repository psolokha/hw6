# Чеклисты шагов HW6 (из tasks.md)

Используй вместе с `tasks.md`. Шаг 1 — эталон в `artifacts/hw6/step1.md`.

---

## Шаг 1. CI/CD пайплайн ✅ (выполнен)

- [x] GitHub Actions: quality + frontend + backend + e2e
- [x] Vercel: frontend + backend (serverless Fastify)
- [x] Lint/format: Prettier + ESLint
- [x] Secrets для E2E
- [x] `integration_documentation.md`, `artifacts/hw6/step1.md`

---

## Шаг 2. Аудит безопасности ✅ (выполнен)

**Цель:** `security_audit.md`, исправления, защита OWASP.

**Агент:**
- [x] `npm audit` в корне, frontend, backend
- [x] security-review (AI) по коду
- [x] проверить: XSS, CSRF, injection, секреты в репо, CORS, auth middleware
- [x] исправить критичное и разумное
- [x] добавить в CI `npm audit` (`--audit-level=high`)
- [x] `security_audit.md`: находки, фиксы, рекомендации
- [x] обновить `integration_documentation.md` (секция безопасности)
- [x] `artifacts/hw6/step2.md`
- [x] тесты зелёные → push → CI

---

## Шаг 3. OAuth2

**Цель:** вход через Google и/или Yandex ID.

**Спросить (если не указано):** какой провайдер(ы).

**Попросить пользователя:** консоль провайдера — Client ID/Secret, redirect URI (`https://hw6-pi-ruddy.vercel.app/...`).

**Агент:**
- [x] backend flow (callback, token exchange, session/JWT)
- [x] frontend: кнопки входа, обработка ошибок
- [ ] env на Vercel (не нужны для Supabase OAuth — ключи в Supabase)
- [ ] Supabase Auth provider enable (если через Supabase) — **нужно пользователю**
- [x] E2E или ручная проверка в браузере
- [x] документация + `artifacts/hw6/step3.md`

---

## Шаг 4. Аналитика ✅ (выполнен)

**Цель:** Яндекс.Метрика / GA / другое (бесплатный tier).

**Попросить:** ID счётчика / measurement ID.

**Агент:**
- [x] интеграция на frontend (события: page view, ключевые действия)
- [x] не ломать CSP/privacy
- [x] проверка отправки (network / dashboard) — прод проверен
- [x] `artifacts/hw6/step4.md`, `integration_documentation.md`

---

## Шаг 5. Платежи — пропущен (опционально)

**Решение:** не интегрировать — в `tasks.md` шаг опциональный; на сайте нет платных функций. См. `artifacts/hw6/step5.md`.

- [x] решение задокументировано в артефактах
- [ ] backend webhook + frontend UI — не делалось (намеренно)

---

## Шаг 6. Мониторинг ✅ (выполнен)

**Агент:**
- [x] health расширен (`/api/health`) — DB ping, JWKS, OSM (информационно)
- [x] frontend `/api/health` — проверка backend
- [x] GitHub Actions `uptime-monitor.yml` (cron + алерты через Notifications)
- [x] Vercel Analytics (из шага 4)
- [x] `artifacts/hw6/step6.md`, `integration_documentation.md`

---

## Шаг 7. Логирование ✅ (выполнен)

**Агент:**
- [x] структурированные логи backend (JSON, уровни)
- [x] не логировать секреты/PII
- [x] промпты/примеры AI-анализа логов в документации
- [x] `artifacts/hw6/step7.md`

---

## Шаг 8. Тестирование и оптимизация

**Агент:**
- [ ] регрессия всех интеграций (OAuth, аналитика, CI)
- [ ] профилирование/рекомендации AI, точечные улучшения
- [ ] E2E 19/19 + CI green
- [ ] `artifacts/hw6/step8.md`

---

## Шаг 9. Оформление результатов

**Агент:**
- [ ] свести `integration_documentation.md`
- [ ] `security_audit.md` актуален
- [ ] README в корне репозитория (setup, deploy, ссылки на прод)
- [ ] `artifacts/hw6/step9.md` — итоговый чеклист сдачи ДЗ

---

## Артефакты сдачи (критерии ДЗ)

| Артефакт | Файл |
|----------|------|
| Документация интеграций | `integration_documentation.md` |
| Отчёт безопасности | `security_audit.md` |
| Отчёты по шагам | `artifacts/hw6/step*.md` |
| Прод | Vercel URLs |
| CI | GitHub Actions green |
