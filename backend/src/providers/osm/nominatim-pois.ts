import { z } from "zod";

import type { LatLng, PoiDTO } from "../../core/contracts.js";
import { inferCategoryIdsFromOsmTags } from "../../core/categories.js";
import { sanitizeHttpUrl } from "../../core/safe-url.js";
import { fetchJson } from "./http.js";

const envSchema = z.object({
  OSM_NOMINATIM_BASE_URL: z.string().url().default("https://nominatim.openstreetmap.org"),
  OSM_USER_AGENT: z.string().min(3).optional(),
});

function getEnv() {
  const env = envSchema.parse(process.env);
  const useMock = process.env.CI === "true" || process.env.OSM_MOCK === "1";
  const userAgent = env.OSM_USER_AGENT ?? (useMock ? "nearstep-mock" : undefined);
  if (!userAgent) {
    throw new Error("OSM_USER_AGENT is required when OSM_MOCK is disabled");
  }
  return { ...env, OSM_USER_AGENT: userAgent };
}

const itemSchema = z.object({
  place_id: z.union([z.string(), z.number()]),
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
  class: z.string().optional(),
  type: z.string().optional(),
  importance: z.number().optional(),
});

const responseSchema = z.array(itemSchema);

const POI_SEARCH_TERMS = [
  "музей",
  "парк",
  "памятник",
  "достопримечательность",
  "театр",
  "собор",
] as const;

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

function nominatimItemToPoi(it: z.infer<typeof itemSchema>): PoiDTO {
  const parts = it.display_name
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const title = parts[0] ?? it.display_name;
  const subtitle = parts.slice(1, 3).join(", ");

  const tags: Record<string, string | undefined> = {};
  if (it.class === "tourism") tags.tourism = it.type;
  if (it.class === "historic") tags.historic = it.type ?? "yes";
  if (it.class === "amenity") tags.amenity = it.type;
  if (it.class === "leisure") tags.leisure = it.type;
  if (it.class === "building") tags.building = it.type;
  if (it.class === "natural") tags.natural = it.type;

  const dto: PoiDTO = {
    id: `nominatim:${String(it.place_id)}`,
    title,
    categories: inferCategoryIdsFromOsmTags(tags),
    location: { lat: Number(it.lat), lng: Number(it.lon) },
  };

  if (subtitle) dto.description = subtitle;
  return dto;
}

async function nominatimSearchRaw(q: string, limit = 8) {
  const env = getEnv();
  const url = new URL("/search", env.OSM_NOMINATIM_BASE_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", String(limit));

  const raw = await fetchJson<unknown>(url.toString(), {
    headers: {
      "User-Agent": env.OSM_USER_AGENT,
      Accept: "application/json",
    },
  });

  return responseSchema.parse(raw);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function nominatimGetPoisNearby(params: {
  center: LatLng;
  radiusMeters: number;
  cityTitle?: string;
  categoryIds?: string[];
}): Promise<PoiDTO[]> {
  const radius = Math.max(50, Math.min(50_000, Math.round(params.radiusMeters)));
  const city = params.cityTitle?.trim();
  if (!city) return [];

  const byId = new Map<string, PoiDTO>();
  const maxDistance = Math.max(radius, 20_000);

  for (const term of POI_SEARCH_TERMS) {
    const items = await nominatimSearchRaw(`${term} ${city}`, 8);
    for (const it of items) {
      const poi = nominatimItemToPoi(it);
      if (haversineMeters(params.center, poi.location) > maxDistance) continue;
      byId.set(poi.id, poi);
    }
    // Nominatim: не более 1 запроса в секунду.
    await sleep(1100);
  }

  let pois = [...byId.values()];
  const want = params.categoryIds?.length ? new Set(params.categoryIds) : null;
  if (want) pois = pois.filter((p) => p.categories.some((c) => want.has(c)));

  pois.sort(
    (a, b) =>
      haversineMeters(params.center, a.location) - haversineMeters(params.center, b.location),
  );
  return pois.slice(0, 80);
}

export async function nominatimGetPoiById(id: string): Promise<PoiDTO | null> {
  const m = /^nominatim:(\d+)$/.exec(id);
  if (!m || !m[1]) return null;

  const env = getEnv();
  const placeId = m[1];
  const url = new URL("/details", env.OSM_NOMINATIM_BASE_URL);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("format", "json");

  const raw = await fetchJson<{
    place_id?: number;
    names?: Record<string, string>;
    address?: Record<string, string>;
    calculated_lat?: string;
    calculated_lon?: string;
    centroid?: { coordinates?: [number, number] };
    extratags?: Record<string, string>;
    category?: string;
    type?: string;
  }>(url.toString(), {
    headers: {
      "User-Agent": env.OSM_USER_AGENT,
      Accept: "application/json",
    },
  });

  const lat = raw.calculated_lat ?? raw.centroid?.coordinates?.[1];
  const lon = raw.calculated_lon ?? raw.centroid?.coordinates?.[0];
  if (lat == null || lon == null) return null;

  const title =
    raw.names?.name ??
    raw.names?.["name:ru"] ??
    raw.address?.tourism ??
    raw.address?.historic ??
    "POI";

  const tags: Record<string, string | undefined> = {
    ...(raw.extratags ?? {}),
  };
  if (raw.category === "tourism") tags.tourism = raw.type;
  if (raw.category === "historic") tags.historic = raw.type ?? "yes";
  if (raw.category === "amenity") tags.amenity = raw.type;
  if (raw.category === "leisure") tags.leisure = raw.type;

  const dto: PoiDTO = {
    id,
    title,
    categories: inferCategoryIdsFromOsmTags(tags),
    location: { lat: Number(lat), lng: Number(lon) },
  };

  const description = raw.extratags?.description ?? raw.extratags?.["description:ru"];
  if (description) dto.description = description;

  const website = raw.extratags?.website ?? raw.extratags?.url;
  const safeExternal = sanitizeHttpUrl(website);
  if (safeExternal) dto.externalUrl = safeExternal;

  return dto;
}
