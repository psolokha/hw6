import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";

import { registerCategoryRoutes } from "./api/routes/categories.js";
import { registerHealthRoutes } from "./api/routes/health.js";
import { registerLocationRoutes } from "./api/routes/locations.js";
import { registerPoiRoutes } from "./api/routes/pois.js";
import { registerRouteBuilderRoutes } from "./api/routes/routes.js";
import { registerFavoritesRoutes } from "./api/routes/favorites.js";
import { unknownError } from "./api/errors.js";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  // На облачных хостингах (Render и т.п.) нужно слушать 0.0.0.0, локально — 127.0.0.1.
  HOST: z.string().default("127.0.0.1"),
  CORS_ORIGIN: z.string().default("http://127.0.0.1:3000"),
});

const env = envSchema.parse(process.env);

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: env.CORS_ORIGIN,
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

await app.listen({ port: env.PORT, host: env.HOST });
