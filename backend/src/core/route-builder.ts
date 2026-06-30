import type { LatLng, PoiDTO, RouteVariantDTO } from "./contracts.js";
import { makeRouteVariantId } from "./route-id.js";

function toRad(n: number) {
  return (n * Math.PI) / 180;
}

function haversineMeters(a: LatLng, b: LatLng) {
  const R = 6371e3;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function loopDistanceMeters(start: LatLng, stops: PoiDTO[]) {
  if (stops.length === 0) return 0;

  let sum = 0;
  let prev = start;
  for (const poi of stops) {
    sum += haversineMeters(prev, poi.location);
    prev = poi.location;
  }
  sum += haversineMeters(prev, start);
  return sum;
}

function signature(stops: RouteVariantDTO["stops"]) {
  return stops.map((s) => s.poi.id).join(">");
}

function pickStops(pois: PoiDTO[], startOffset: number, count: number): RouteVariantDTO["stops"] {
  const n = pois.length;
  const stops: RouteVariantDTO["stops"] = [];
  for (let i = 0; i < count; i++) {
    const poi = pois[(startOffset + i) % n];
    if (!poi) continue;
    stops.push({ order: i + 1, poi });
  }
  return stops;
}

function makeVariant(
  kind: RouteVariantDTO["kind"],
  start: LatLng,
  totalDistanceMeters: number,
  stops: RouteVariantDTO["stops"],
): RouteVariantDTO {
  return {
    id: makeRouteVariantId({ kind, start, stops }),
    kind,
    totalDistanceMeters: Math.round(totalDistanceMeters),
    stops,
    isLoop: true,
    start,
  };
}

export function buildRouteVariants(params: {
  start: LatLng;
  pois: PoiDTO[];
  targetDistanceKm: number;
  maxVariants: 1 | 2 | 3;
}): RouteVariantDTO[] {
  const MIN_KM = 2;
  const MAX_KM = 50;

  const maxVariants = Math.max(1, Math.min(3, params.maxVariants)) as 1 | 2 | 3;
  if (params.pois.length < 3) return [];

  const Lkm = Math.min(MAX_KM, Math.max(MIN_KM, params.targetDistanceKm));
  const Lm = Lkm * 1000;

  const ratio = (Lkm - MIN_KM) / (MAX_KM - MIN_KM); // 0..1
  const nBase = Math.min(5, Math.max(3, 3 + Math.round(ratio * 2))); // 3..5 stops

  const shorterLow = 0.8 * Lm;
  const shorterHigh = 0.95 * Lm;
  const nearLow = 0.92 * Lm;
  const nearHigh = 1.08 * Lm;
  const longerLow = Lm;
  const longerHigh = Lm + Math.min(2000, 0.2 * Lm);

  const shorterCount = Math.max(3, nBase - 1);
  const nearCount = nBase;
  const longerCount = Math.min(5, nBase + 1);

  const pickBestVariant = (
    kind: RouteVariantDTO["kind"],
    count: number,
    rangeLow: number,
    rangeHigh: number,
    avoid: Set<string>,
  ): RouteVariantDTO | null => {
    let bestStops: RouteVariantDTO["stops"] | null = null;
    let bestDist = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    const candidates: { dist: number; stops: RouteVariantDTO["stops"] }[] = [];
    for (let offset = 0; offset < params.pois.length; offset++) {
      const stops = pickStops(params.pois, offset, count);
      if (avoid.has(signature(stops))) continue;
      const dist = loopDistanceMeters(
        params.start,
        stops.map((s) => s.poi),
      );
      if (dist >= rangeLow && dist <= rangeHigh) candidates.push({ dist, stops });
    }

    const mid = (rangeLow + rangeHigh) / 2;
    const pickFrom = candidates.length
      ? candidates
      : Array.from({ length: params.pois.length }).flatMap((_, offset) => {
          const stops = pickStops(params.pois, offset, count);
          if (avoid.has(signature(stops))) return [];
          const dist = loopDistanceMeters(
            params.start,
            stops.map((s) => s.poi),
          );
          return [{ dist, stops }];
        });

    for (const c of pickFrom) {
      const score = Math.abs(c.dist - mid);
      if (score < bestScore) {
        bestScore = score;
        bestDist = c.dist;
        bestStops = c.stops;
      }
    }

    if (!bestStops) return null;
    return makeVariant(kind, params.start, bestDist, bestStops);
  };

  const avoid = new Set<string>();
  const out: RouteVariantDTO[] = [];

  const tryAdd = (v: RouteVariantDTO | null) => {
    if (!v) return;
    const sig = signature(v.stops);
    if (avoid.has(sig)) return;
    avoid.add(sig);
    out.push(v);
  };

  tryAdd(pickBestVariant("near", nearCount, nearLow, nearHigh, avoid));
  if (out.length < maxVariants)
    tryAdd(pickBestVariant("shorter", shorterCount, shorterLow, shorterHigh, avoid));
  if (out.length < maxVariants)
    tryAdd(pickBestVariant("longer", longerCount, longerLow, longerHigh, avoid));

  return out;
}
