## Stage 6 — Frontend: remove mocks, connect to backend

### Цель
Полностью отвязать `frontend/` от `@/data/mock/*` и переключить на backend.

### Требования
- Реализовать `HttpNavigatorDataSource` (реализация `NavigatorDataSource`) который ходит в backend.
- Добавить конфиг `NEXT_PUBLIC_BACKEND_URL` или аналог.
- Заменить `getNavigatorDataSource()` так, чтобы возвращал HTTP-реализацию.
- Удалить прямое использование mock функций в:
  - `route/build`, `route/results`, `poi/[id]`, `favorites`, `popular-routes`.
- Карточка POI:
  - получать данные по `GET /api/pois/:id` (или по ids) вместо `getMockPoiById`.
  - убрать `generateStaticParams` на моках (перейти на dynamic route).
- Избранное:
  - до логина — localStorage как сейчас
  - после логина — читать/писать через backend
  - при логине — sync локального избранного на сервер

### Что сделать
1. Найти и удалить все импорты `@/data/mock/*` в `frontend/app` и `frontend/components`.
2. Внедрить `HttpNavigatorDataSource`.
3. Добавить минимальный UI auth (email+password) и хранение токена.
4. Пройтись по основным сценариям: location search → catalog → build route → results → favorites.
