import type { LatLng, LocationSuggestionDTO, PoiDTO } from "../../core/contracts.js";
import { mockLocations, mockPois } from "./mock-data.js";

function haversineMeters(a: LatLng, b: LatLng) {
  const R = 6371e3;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function mockSearchLocations(q: string): LocationSuggestionDTO[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];

  return mockLocations
    .filter((l) => l.title.toLowerCase().includes(needle) || (l.subtitle ?? "").toLowerCase().includes(needle))
    .slice(0, 8);
}

export function mockGetPoisNearby(params: {
  center: LatLng;
  radiusMeters: number;
  categoryIds?: string[];
}): PoiDTO[] {
  const radius = Math.max(50, Math.min(50_000, Math.round(params.radiusMeters)));
  const want = params.categoryIds?.length ? new Set(params.categoryIds) : null;

  return mockPois
    .filter((p) => haversineMeters(params.center, p.location) <= radius)
    .filter((p) => (want ? p.categories.some((c) => want.has(c)) : true));
}

export function mockGetPoiById(id: string): PoiDTO | null {
  return mockPois.find((p) => p.id === id) ?? null;
}

