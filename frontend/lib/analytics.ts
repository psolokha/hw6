/**
 * Яндекс.Метрика: цели (reachGoal) для ключевых действий в приложении.
 * Счётчик подключается через `YandexMetrika` при наличии NEXT_PUBLIC_YM_COUNTER_ID.
 */

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void
  }
}

export const AnalyticsEvents = {
  LOCATION_SELECTED: "location_selected",
  CATALOG_ROUTE_START: "catalog_route_start",
  ROUTE_BUILD_SUBMIT: "route_build_submit",
  ROUTE_BUILT: "route_built",
  FAVORITE_ADDED: "favorite_added",
  AUTH_LOGIN: "auth_login",
  AUTH_SIGNUP: "auth_signup",
  OAUTH_START: "oauth_start",
  OAUTH_SUCCESS: "oauth_success",
} as const

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]

export type AnalyticsParams = Record<string, string | number | boolean>

export function getYmCounterId(): number | null {
  const raw = process.env.NEXT_PUBLIC_YM_COUNTER_ID?.trim()
  if (!raw) return null
  const id = Number(raw)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function isAnalyticsEnabled(): boolean {
  return getYmCounterId() !== null
}

function callYm(method: string, ...args: unknown[]) {
  const counterId = getYmCounterId()
  if (!counterId || typeof window === "undefined" || typeof window.ym !== "function") return
  window.ym(counterId, method, ...args)
}

/** Отправка цели (custom event) в Метрику. */
export function trackEvent(name: AnalyticsEventName, params?: AnalyticsParams) {
  if (!isAnalyticsEnabled()) return
  if (params && Object.keys(params).length > 0) {
    callYm("params", params)
  }
  callYm("reachGoal", name)
}

/** SPA page view — вызывается при смене маршрута. */
export function trackPageView(url?: string) {
  if (!isAnalyticsEnabled()) return
  callYm("hit", url ?? window.location.pathname + window.location.search)
}
