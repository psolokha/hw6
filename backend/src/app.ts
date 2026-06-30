import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";

import { registerCategoryRoutes } from "./api/routes/categories.js";
import { registerHealthRoutes } from "./api/routes/health.js";
import { registerLocationRoutes } from "./api/routes/locations.js";
import { registerPoiRoutes } from "./api/routes/pois.js";
import { registerRouteBuilderRoutes } from "./api/routes/routes.js";
import { registerFavoritesRoutes } from "./api/routes/favorites.js";
import { unknownError } from "./api/errors.js";

const corsSchema = z.object({
  CORS_ORIGIN: z.string().default("http://127.0.0.1:3000"),
});

// Создаёт и настраивает Fastify-приложение БЕЗ вызова listen().
// Используется как локальным сервером (index.ts), так и serverless-обработчиком на Vercel (api/index.ts).
export async function buildApp(): Promise<FastifyInstance> {
  const { CORS_ORIGIN } = corsSchema.parse(process.env);

  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: CORS_ORIGIN,
  });

  await registerCategoryRoutes(app);
  await registerHealthRoutes(app);
  await registerLocationRoutes(app);
  await registerPoiRoutes(app);
  await registerRouteBuilderRoutes(app);
  await registerFavoritesRoutes(app);

  app.setErrorHandler((err, req, reply) => {
    req.log.error({ err }, "unhandled error");
    reply.status(500).send(unknownError("Внутренняя ошибка сервера"));
  });

  return app;
}
