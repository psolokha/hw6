// Единая точка получения URL бэкенда.
// Приоритет — переменная окружения NEXT_PUBLIC_BACKEND_URL (задаётся на хостинге/в .env.local).
// Прод-fallback нужен, чтобы задеплоенный фронт работал даже без ручной настройки env на Vercel.
const PROD_FALLBACK = "https://hw6-ac72.vercel.app"

export function getBackendUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BACKEND_URL?.trim().replace(/\/+$/, "")
  return fromEnv || PROD_FALLBACK
}
