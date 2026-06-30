import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { makeCacheKey, roundCoord } from "../../core/cache-key.js";
import { zodErrorMessage, unknownError, validationError } from "../errors.js";
import { getProviderCache, setProviderCache } from "../../db/provider-cache.repo.js";
import { nominatimGetPoiById, nominatimGetPoisNearby } from "../../providers/osm/nominatim-pois.js";
import { overpassGetPoiById, overpassGetPoisNearby } from "../../providers/osm/overpass.js";
import { mockGetPoiById, mockGetPoisNearby } from "../../providers/osm/mock.js";

const envSchema = z.object({
  CACHE_TTL_SECONDS: z.coerce.number().int().min(1).default(86400),
});

const env = envSchema.parse(process.env);

function parseCategoryIds(raw: unknown): string[] | undefined {
  if (typeof raw !== "string") return undefined;
  const items = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

async function getPoisNearbyWithFallback(params: {
  lat: number;
  lng: number;
  radiusMeters: number;
  categoryIds?: string[];
  cityTitle?: string;
  log: { warn: (obj: unknown, msg?: string) => void };
}) {
  const center = { lat: params.lat, lng: params.lng };
  const common = {
    center,
    radiusMeters: params.radiusMeters,
    ...(params.categoryIds ? { categoryIds: params.categoryIds } : {}),
  };

  try {
    return await overpassGetPoisNearby(common);
  } catch (e) {
    params.log.warn({ err: e }, "overpass nearby failed, trying nominatim fallback");
    if (!params.cityTitle?.trim()) throw e;
    return await nominatimGetPoisNearby({
      ...common,
      cityTitle: params.cityTitle.trim(),
    });
  }
}

export async function registerPoiRoutes(app: FastifyInstance) {
  app.get("/api/pois", async (req, reply) => {
    const categoryIds = parseCategoryIds((req.query as any)?.categoryIds);
    const cityTitle = typeof (req.query as any)?.cityTitle === "string" ? (req.query as any).cityTitle : undefined;

    const parsed = z
      .object({
        by: z.literal("nearby"),
        lat: z.coerce.number().min(-90).max(90),
        lng: z.coerce.number().min(-180).max(180),
        radiusMeters: z.coerce.number().int().min(50).max(50000),
        cityTitle: z.string().min(1).max(200).optional(),
      })
      .safeParse(req.query);

    if (!parsed.success) {
      return reply.status(400).send(validationError(zodErrorMessage(parsed.error)));
    }

    const { lat, lng, radiusMeters } = parsed.data;
    const useMock = process.env.CI === "true" || process.env.OSM_MOCK === "1";
    const cacheKey = makeCacheKey("osm:pois:nearby", {
      lat: roundCoord(lat, 3),
      lng: roundCoord(lng, 3),
      radiusMeters,
      categoryIds: categoryIds?.slice().sort() ?? null,
      cityTitle: cityTitle?.trim() ?? null,
    });

    const cached = useMock ? null : await getProviderCache<unknown>(cacheKey);
    if (cached) return cached;

    let out;
    try {
      out = useMock
        ? mockGetPoisNearby({
            center: { lat, lng },
            radiusMeters,
            ...(categoryIds ? { categoryIds } : {}),
          })
        : await getPoisNearbyWithFallback({
            lat,
            lng,
            radiusMeters,
            ...(categoryIds ? { categoryIds } : {}),
            ...(cityTitle ? { cityTitle } : {}),
            log: req.log,
          });
    } catch (e) {
      req.log.error({ err: e }, "pois nearby failed");
      return reply.status(502).send(unknownError("Провайдер временно недоступен"));
    }

    if (!useMock) {
      await setProviderCache({
        cacheKey,
        provider: "osm",
        kind: "pois_nearby",
        request: { by: "nearby", lat, lng, radiusMeters, categoryIds, cityTitle },
        response: out,
        ttlSeconds: env.CACHE_TTL_SECONDS,
      });
    }

    return out;
  });

  app.get("/api/pois/:id", async (req, reply) => {
    const parsed = z.object({ id: z.string().min(1).max(200) }).safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send(validationError(zodErrorMessage(parsed.error)));
    }

    const id = parsed.data.id;
    const useMock = process.env.CI === "true" || process.env.OSM_MOCK === "1";
    const cacheKey = makeCacheKey("osm:poiById", { id });

    const cached = useMock ? null : await getProviderCache<unknown>(cacheKey);
    if (cached) return cached;

    let out;
    try {
      if (useMock) {
        out = mockGetPoiById(id);
      } else if (id.startsWith("nominatim:")) {
        out = await nominatimGetPoiById(id);
      } else {
        out = await overpassGetPoiById(id);
      }
    } catch (e) {
      req.log.error({ err: e }, "poi by id failed");
      return reply.status(502).send(unknownError("Провайдер временно недоступен"));
    }

    if (!out) return reply.status(404).send({ error: { message: "POI не найден", kind: "UNKNOWN" } });

    if (!useMock) {
      await setProviderCache({
        cacheKey,
        provider: "osm",
        kind: "poi_by_id",
        request: { id },
        response: out,
        ttlSeconds: env.CACHE_TTL_SECONDS,
      });
    }

    return out;
  });
}
