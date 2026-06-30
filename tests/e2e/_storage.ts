import type { Page } from "@playwright/test"

// Ключи совпадают с `frontend/lib/app-storage.ts`.
const KEY_LOCATION = "hw4_nav_location_v1"
const KEY_FAVORITES = "hw4_nav_favorites_v1"
const KEY_ROUTE_BUILD = "hw4_nav_route_build_v1"
const KEY_ROUTE_POI_IDS = "hw4_nav_route_poi_ids_v1"
const KEY_ROUTE_POIS = "hw4_nav_route_pois_v1"

type LatLng = { lat: number; lng: number }

type LocationSelectionDTO =
  | { mode: "city"; locationId: string; title: string; center: LatLng }
  | { mode: "nearby"; title: string; center: LatLng; radiusMeters: number }

export async function initStorage(page: Page, opts?: { location?: LocationSelectionDTO }) {
  const location = opts?.location

  // Важно: делаем установку состояния ОДИН РАЗ в начале теста.
  // Не используем addInitScript, иначе состояние будет “сбрасываться” на каждую навигацию,
  // что ломает тесты, где мы проверяем сохранение (например, избранное).
  await page.goto("/")
  await page.evaluate(
    ({ location, keys }) => {
      localStorage.removeItem(keys.KEY_ROUTE_BUILD)
      localStorage.setItem(keys.KEY_FAVORITES, "[]")
      sessionStorage.removeItem(keys.KEY_ROUTE_POI_IDS)
      sessionStorage.removeItem(keys.KEY_ROUTE_POIS)

      if (location) localStorage.setItem(keys.KEY_LOCATION, JSON.stringify(location))
      else localStorage.removeItem(keys.KEY_LOCATION)
    },
    { location, keys: { KEY_LOCATION, KEY_FAVORITES, KEY_ROUTE_BUILD, KEY_ROUTE_POI_IDS, KEY_ROUTE_POIS } }
  )
}

export const ROME_LOCATION: LocationSelectionDTO = {
  mode: "city",
  locationId: "loc-rome",
  title: "Рим",
  // Центр ближе к историческому ядру, чтобы при небольшом радиусе (в e2e) попадали POI из моков.
  center: { lat: 41.9031, lng: 12.4663 },
}

