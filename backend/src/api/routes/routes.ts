import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { buildRouteVariants } from "../../core/route-builder.js";
import { zodErrorMessage, validationError } from "../errors.js";

const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const poiSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  categories: z.array(z.string().min(1)),
  location: latLngSchema,
  photoUrl: z.string().min(1).optional(),
  externalUrl: z.string().min(1).optional(),
});

const buildSchema = z.object({
  start: latLngSchema,
  pois: z.array(poiSchema).min(3),
  targetDistanceKm: z.number().min(2).max(50),
  maxVariants: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

export async function registerRouteBuilderRoutes(app: FastifyInstance) {
  app.post("/api/routes/build", async (req, reply) => {
    const parsed = buildSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(validationError(zodErrorMessage(parsed.error)));
    }

    const out = buildRouteVariants({
      start: parsed.data.start,
      pois: parsed.data.pois,
      targetDistanceKm: parsed.data.targetDistanceKm,
      maxVariants: parsed.data.maxVariants ?? 3,
    });

    return out;
  });
}
