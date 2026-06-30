import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";

import { registerAuthRoutes } from "./api/routes/auth.js";
import { registerCategoryRoutes } from "./api/routes/categories.js";
import { registerHealthRoutes } from "./api/routes/health.js";
import { registerLocationRoutes } from "./api/routes/locations.js";
import { registerPoiRoutes } from "./api/routes/pois.js";
import { registerRouteBuilderRoutes } from "./api/routes/routes.js";
import { registerFavoritesRoutes } from "./api/routes/favorites.js";
import { unknownError } from "./api/errors.js";
import { createLoggerOptions } from "./core/logger.js";

const corsSchema = z.object({
  CORS_ORIGIN: z.string().default("http://127.0.0.1:3000"),
});

// Создаёт и настраивает Fastify-приложение БЕЗ вызова listen().
// Используется как локальным сервером (index.ts), так и serverless-обработчиком на Vercel (api/index.ts).
export async function buildApp(): Promise<FastifyInstance> {
  const { CORS_ORIGIN } = corsSchema.parse(process.env);

  // Нормализуем origin(ы): поддержка списка через запятую и устойчивость к хвостовому слэшу,
  // т.к. браузер шлёт Origin без завершающего "/".
  const origins = CORS_ORIGIN.split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const app = Fastify({
    logger: createLoggerOptions(),
    bodyLimit: 256 * 1024,
    disableRequestLogging: true,
    requestIdHeader: "x-request-id",
    genReqId: (req) => {
      const header = req.headers["x-request-id"];
      if (typeof header === "string" && header.length > 0 && header.length <= 128) return header;
      return randomUUID();
    },
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    allowList: (req) => req.url === "/api/health",
  });

  await app.register(cors, {
    origin: origins.length <= 1 ? (origins[0] ?? false) : origins,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await registerAuthRoutes(app);
  await registerCategoryRoutes(app);
  await registerHealthRoutes(app);
  await registerLocationRoutes(app);
  await registerPoiRoutes(app);
  await registerRouteBuilderRoutes(app);
  await registerFavoritesRoutes(app);

  app.addHook("onResponse", async (req, reply) => {
    const level = reply.statusCode >= 500 ? "error" : reply.statusCode >= 400 ? "warn" : "info";
    req.log[level](
      {
        event: "http_request",
        method: req.method,
        url: req.url,
        statusCode: reply.statusCode,
        responseTimeMs: Math.round(reply.elapsedTime),
      },
      "request completed",
    );
  });

  app.setErrorHandler((err, req, reply) => {
    req.log.error(
      {
        err,
        event: "unhandled_error",
        method: req.method,
        url: req.url,
      },
      "unhandled error",
    );
    reply.status(500).send(unknownError("Внутренняя ошибка сервера"));
  });

  return app;
}
