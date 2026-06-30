import { z } from "zod";

import type { LocationSuggestionDTO } from "../../core/contracts.js";
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
  importance: z.number().optional(),
  class: z.string().optional(),
  type: z.string().optional(),
});

const responseSchema = z.array(itemSchema);

export async function nominatimSearchLocations(q: string): Promise<LocationSuggestionDTO[]> {
  const query = q.trim();
  if (!query) return [];

  const env = getEnv();
  const url = new URL("/search", env.OSM_NOMINATIM_BASE_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", "8");

  const raw = await fetchJson<unknown>(url.toString(), {
    headers: {
      "User-Agent": env.OSM_USER_AGENT,
      Accept: "application/json",
    },
  });

  const classScore = (it: z.infer<typeof itemSchema>) => {
    if (it.class === "place") return 3;
    if (it.class === "boundary") return 0;
    return 1;
  };

  const items = responseSchema
    .parse(raw)
    .sort((a, b) => classScore(b) - classScore(a) || (b.importance ?? 0) - (a.importance ?? 0));

  const bestByTitle = new Map<string, z.infer<typeof itemSchema>>();
  for (const it of items) {
    const parts = it.display_name
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const title = parts[0] ?? it.display_name;
    const prev = bestByTitle.get(title);
    if (!prev) {
      bestByTitle.set(title, it);
      continue;
    }
    const prevIsPlace = prev.class === "place";
    const nextIsPlace = it.class === "place";
    if (nextIsPlace && !prevIsPlace) {
      bestByTitle.set(title, it);
      continue;
    }
    if (prevIsPlace === nextIsPlace && Number(it.lat) > Number(prev.lat)) {
      bestByTitle.set(title, it);
    }
  }

  return [...bestByTitle.values()].map((it) => {
    const parts = it.display_name
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const title = parts[0] ?? it.display_name;
    const subtitle = parts.slice(1, 3).join(", ");

    const dto: LocationSuggestionDTO = {
      id: `nominatim:${String(it.place_id)}`,
      title,
      center: { lat: Number(it.lat), lng: Number(it.lon) },
    };

    if (subtitle) dto.subtitle = subtitle;
    return dto;
  });
}
