import type { FastifyInstance } from "fastify";

import { CATEGORIES } from "../../core/categories.js";

export async function registerCategoryRoutes(app: FastifyInstance) {
  app.get("/api/categories", async (_req, reply) => {
    reply.header("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
    return CATEGORIES;
  });
}
