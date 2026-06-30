import type { Id, LatLng, RouteStopDTO, RouteVariantKind } from "./contracts.js";

function formatLatLng(n: number, digits: number) {
  return Number(n.toFixed(digits));
}

export function makeRouteVariantId(args: { kind: RouteVariantKind; start: LatLng; stops: RouteStopDTO[] }): Id {
  const lat = formatLatLng(args.start.lat, 5);
  const lng = formatLatLng(args.start.lng, 5);
  const stopPoiIds = args.stops.map((s) => s.poi.id).join(",");

  return `route-${args.kind}-${lat}-${lng}-${stopPoiIds}`;
}

