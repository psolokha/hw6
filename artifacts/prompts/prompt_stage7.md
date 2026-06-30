## Stage 7 — Tests & CI stability (frontend + backend)

### Цель
Обновить e2e так, чтобы тесты поднимали backend и проходили на реальных данных.

### Требования
- Playwright должен поднимать 2 сервера:
  - frontend (Next dev)
  - backend (node dev)
- Тесты должны быть стабильными:
  - использовать фикстуры/предсказуемость через кэш
  - при необходимости мокать внешний OSM на уровне backend (для CI)

### Что сделать
1. Обновить `playwright.config.ts` (добавить второй `webServer` или pre-start script).
2. Добавить env для тестов:
   - backend URL
   - test user для Supabase Auth (или создание перед тестом)
3. Прогнать `npm run test:e2e`, исправить падения.
