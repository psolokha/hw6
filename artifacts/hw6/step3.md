# Шаг 3. Интеграция OAuth2

## Итог

Шаг 3 выполнен в коде: OAuth2 через **Google** и **Supabase Auth** (PKCE/state на стороне Supabase), callback на фронте, профиль пользователя на бэкенде (`GET /api/auth/me`). Для работы на проде требуется одноразовая настройка Google Cloud + Supabase Dashboard (Client ID/Secret).

## Что сделано

- **Frontend**
  - `signInWithOAuth` (`frontend/lib/oauth.ts`) с redirect на `/auth/callback`.
  - Route handler `frontend/app/auth/callback/route.ts` — `exchangeCodeForSession`.
  - Кнопка «Войти через Google» в диалоге входа (`oauth-buttons.tsx`, `app-header.tsx`).
  - Обработка ошибок OAuth (query `auth_error`, понятные сообщения).
- **Backend**
  - Расширен `verifyBearerToken` — извлечение email и provider из JWT.
  - `GET /api/auth/me` — профиль после OAuth или email-входа.
- **Безопасность**
  - CSP: `connect-src` дополнен `https://accounts.google.com`.
  - Redirect URI whitelist — в Supabase URL Configuration (инструкция в `integration_documentation.md`).
- **Тесты**
  - E2E: кнопка Google в UI; smoke для `/api/auth/me` (401 без токена).
- **Документация**: секция OAuth2 в `integration_documentation.md`.

## Проверки

```bash
npm run format:check && npm run lint
npm --prefix frontend run typecheck && npm --prefix frontend run build
npm --prefix backend run typecheck && npm --prefix backend run build
npm run test:e2e              # 22 passed (добавлены oauth + auth/me smoke)
```

Ручная проверка после настройки провайдера:
- https://hw6-pi-ruddy.vercel.app/catalog → «Войти» → «Войти через Google» → успешный вход.
- `GET https://hw6-ac72.vercel.app/api/auth/me` с Bearer JWT → `provider: "google"`.
