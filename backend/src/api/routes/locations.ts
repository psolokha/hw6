import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { zodErrorMessage, unknownError, validationError } from "../errors.js";
import { makeCacheKey } from "../../core/cache-key.js";
import { getProviderCache, setProviderCache } from "../../db/provider-cache.repo.js";
import { nominatimSearchLocations } from "../../providers/osm/nominatim.js";
import { mockSearchLocations } from "../../providers/osm/mock.js";

const envSchema = z.object({
  CACHE_TTL_SECONDS: z.coerce.number().int().min(1).default(86400),
});

const env = envSchema.parse(process.env);

export async function registerLocationRoutes(app: FastifyInstance) {
  app.get("/api/locations/search", async (req, reply) => {
    const parsed = z.object({ q: z.string().min(1).max(200) }).safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send(validationError(zodErrorMessage(parsed.error)));
    }

    const q = parsed.data.q;
    const useMock = process.env.CI === "true" || process.env.OSM_MOCK === "1";
    const cacheKey = makeCacheKey("osm:nominatim:search:v4", { q: q.trim().toLowerCase() });

    const cached = useMock ? null : await getProviderCache<unknown>(cacheKey);
    if (cached) return cached;

    let out;
    try {
      out = useMock ? mockSearchLocations(q) : await nominatimSearchLocations(q);
    } catch (e) {
      req.log.error({ err: e }, "nominatim search failed");
      return reply.status(502).send(unknownError("Провайдер временно недоступен"));
    }

    if (!useMock) {
      await setProviderCache({
        cacheKey,
        provider: "osm",
        kind: "nominatim_search",
        request: { q },
        response: out,
        ttlSeconds: env.CACHE_TTL_SECONDS,
      });
    }

    return out;
  });
}
