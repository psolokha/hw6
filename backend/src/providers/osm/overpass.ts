import { z } from "zod";

import type { LatLng, PoiDTO } from "../../core/contracts.js";
import { inferCategoryIdsFromOsmTags } from "../../core/categories.js";
import { fetchJson } from "./http.js";

const envSchema = z.object({
  OSM_OVERPASS_BASE_URL: z.string().url().default("https://overpass-api.de/api/interpreter"),
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

const elementSchema = z.object({
  type: z.enum(["node", "way", "relation"]),
  id: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z
    .object({
      lat: z.number(),
      lon: z.number(),
    })
    .optional(),
  tags: z.record(z.string(), z.string()).optional(),
});

const responseSchema = z.object({
  elements: z.array(elementSchema),
});

function osmElementId(el: z.infer<typeof elementSchema>): string {
  const prefix = el.type === "node" ? "n" : el.type === "way" ? "w" : "r";
  return `osm:${prefix}${el.id}`;
}

function elementToPoi(el: z.infer<typeof elementSchema>): PoiDTO | null {
  const tags = el.tags ?? {};
  const name = tags.name || tags["name:en"] || tags["name:ru"];

  const centerLat = el.lat ?? el.center?.lat;
  const centerLon = el.lon ?? el.center?.lon;
  if (centerLat == null || centerLon == null) return null;

  const title = name ?? tags.tourism ?? tags.amenity ?? tags.historic ?? "POI";
  const description = tags.description ?? tags["description:ru"] ?? tags.wikipedia;

  const website = tags.website ?? tags.url;
  const wikidata = tags.wikidata;
  const externalUrl = website ?? (wikidata ? `https://www.wikidata.org/wiki/${wikidata}` : undefined);

  const dto: PoiDTO = {
    id: osmElementId(el),
    title,
    categories: inferCategoryIdsFromOsmTags(tags),
    location: { lat: centerLat, lng: centerLon },
  };

  if (description) dto.description = description;
  if (externalUrl) dto.externalUrl = externalUrl;
  return dto;
}

export async function overpassGetPoisNearby(params: {
  center: LatLng;
  radiusMeters: number;
  categoryIds?: string[];
}): Promise<PoiDTO[]> {
  const env = getEnv();
  // Category filtering happens after fetch (simple + stable)
  const lat = params.center.lat;
  const lng = params.center.lng;
  const radius = Math.max(50, Math.min(50000, Math.round(params.radiusMeters)));

  // Прицельный запрос: только теги, которые реально маппятся в наши категории
  // (см. inferCategoryIdsFromOsmTags). Это резко сокращает объём ответа и нагрузку
  // на публичный Overpass — иначе [amenity]/[leisure] тянут скамейки, урны, парковки и т.п.
  const around = `around:${radius},${lat},${lng}`;
  const q = `
[out:json][timeout:25];
(
  nwr(${around})["tourism"~"^(museum|gallery|attraction|artwork|viewpoint|theme_park|zoo)$"];
  nwr(${around})["historic"];
  nwr(${around})["amenity"~"^(restaurant|cafe|bar|pub|fast_food|place_of_worship|theatre|arts_centre)$"];
  nwr(${around})["leisure"~"^(park|garden)$"];
  nwr(${around})["natural"~"^(peak|beach|spring|waterfall)$"];
  nwr(${around})["building"~"^(cathedral|church|palace|castle|temple|mosque)$"];
);
out tags 80;
`;

  const raw = await fetchJson<unknown>(env.OSM_OVERPASS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      "User-Agent": env.OSM_USER_AGENT,
      Accept: "application/json",
    },
    body: q,
  });

  const parsed = responseSchema.parse(raw);
  const pois = parsed.elements.map(elementToPoi).filter(Boolean) as PoiDTO[];

  const want = params.categoryIds?.length ? new Set(params.categoryIds) : null;
  if (!want) return pois;

  return pois.filter((p) => p.categories.some((c) => want.has(c)));
}

export async function overpassGetPoiById(osmId: string): Promise<PoiDTO | null> {
  const env = getEnv();
  const m = /^osm:([nwr])(\d+)$/.exec(osmId);
  if (!m) return null;

  const [, kind, idStr] = m;
  const id = Number(idStr);

  const stmt =
    kind === "n"
      ? `node(${id});`
      : kind === "w"
        ? `way(${id});`
        : `relation(${id});`;

  const q = `
[out:json][timeout:25];
(${stmt});
out center tags;
`;

  const raw = await fetchJson<unknown>(env.OSM_OVERPASS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      "User-Agent": env.OSM_USER_AGENT,
      Accept: "application/json",
    },
    body: q,
  });

  const parsed = responseSchema.parse(raw);
  const el = parsed.elements[0];
  if (!el) return null;
  return elementToPoi(el);
}

