import type { Id, LatLng, RouteStopDTO, RouteVariantDTO, RouteVariantKind } from "@/data/types"

function formatLatLng(n: number, digits: number) {
  // Округление фиксирует плавающую точку, чтобы `id` был детерминированным.
  return Number(n.toFixed(digits))
}

export function makeRouteVariantId(args: {
  kind: RouteVariantKind
  start: LatLng
  stops: RouteStopDTO[]
}): Id {
  const lat = formatLatLng(args.start.lat, 5)
  const lng = formatLatLng(args.start.lng, 5)
  const stopPoiIds = args.stops.map((s) => s.poi.id).join(",")

  return `route-${args.kind}-${lat}-${lng}-${stopPoiIds}`
}

export function makeRouteVariantIdFromRoute(route: RouteVariantDTO): Id {
  return makeRouteVariantId({
    kind: route.kind,
    start: route.start,
    stops: route.stops,
  })
}

