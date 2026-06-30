# Пользовательские истории: мобильный навигатор по достопримечательностям (MVP)

## Навигация по артефактам

[Персоны (сводная таблица)](personas/personas.md)

| Персона | Пользовательские истории | Критерии приёмки |
|---------|--------------------------|------------------|
| «Анна — турист» | [anna-tourist.md](personas/anna-tourist.md) | [anna-tourist-acceptance-criteria.md](anna-tourist-acceptance-criteria.md) |
| «Дмитрий — местный» | [dmitriy-local.md](personas/dmitriy-local.md) | [dmitriy-local-acceptance-criteria.md](dmitriy-local-acceptance-criteria.md) |
| «Елена — деловой путешественник» | [elena-business.md](personas/elena-business.md) | [elena-business-acceptance-criteria.md](elena-business-acceptance-criteria.md) |

---

## Легенда приоритетов

| Приоритет | Смысл |
|-----------|--------|
| Высокий | Без этого нет основного сценария MVP: выбор области, работа с каталогом, построение кольцевого маршрута. |
| Средний | Важно для полноты продукта и целевых персон: выход во внешние карты, вход по геолокации, сокращение шагов до маршрута. |
| Низкий | Улучшает удержание и UX, но не блокирует базовое использование: избранное, свободный просмотр каталога без навязывания маршрута. |

## Сводная таблица: история → персоны (детальные критерии)

| История | Приоритет | Анна (турист) | Дмитрий (местный) | Елена (деловой) |
|---------|-----------|----------------|-------------------|-----------------|
| US-01 | Высокий | [US-A1](anna-tourist-acceptance-criteria.md#us-a1) | [US-D1](dmitriy-local-acceptance-criteria.md#us-d1) | [US-E1](elena-business-acceptance-criteria.md#us-e1) |
| US-02 | Высокий | [US-A3](anna-tourist-acceptance-criteria.md#us-a3) | — | [US-E6](elena-business-acceptance-criteria.md#us-e6) |
| US-03 | Высокий | [US-A2](anna-tourist-acceptance-criteria.md#us-a2) | [US-D2](dmitriy-local-acceptance-criteria.md#us-d2) | — |
| US-04 | Высокий | [US-A4](anna-tourist-acceptance-criteria.md#us-a4) | [US-D3](dmitriy-local-acceptance-criteria.md#us-d3) | [US-E2](elena-business-acceptance-criteria.md#us-e2) |
| US-05 | Высокий | [US-A5](anna-tourist-acceptance-criteria.md#us-a5) | [US-D4](dmitriy-local-acceptance-criteria.md#us-d4), [US-D8](dmitriy-local-acceptance-criteria.md#us-d8) | [US-E3](elena-business-acceptance-criteria.md#us-e3) |
| US-08 | Средний | [US-A8](anna-tourist-acceptance-criteria.md#us-a8) | [US-D7](dmitriy-local-acceptance-criteria.md#us-d7) | [US-E4](elena-business-acceptance-criteria.md#us-e4), [US-E5](elena-business-acceptance-criteria.md#us-e5) |
| US-09 | Средний | [US-A9](anna-tourist-acceptance-criteria.md#us-a9) | — | — |
| US-11 | Средний | [US-A10](anna-tourist-acceptance-criteria.md#us-a10) | [US-D9](dmitriy-local-acceptance-criteria.md#us-d9) | — |
| US-06 | Низкий | [US-A6](anna-tourist-acceptance-criteria.md#us-a6) | [US-D5](dmitriy-local-acceptance-criteria.md#us-d5), [US-D6](dmitriy-local-acceptance-criteria.md#us-d6) | — |
| US-07 | Низкий | [US-A7](anna-tourist-acceptance-criteria.md#us-a7) | — | — |