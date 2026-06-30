import type { FastifyInstance } from "fastify";

import { CATEGORIES } from "../../core/categories.js";

export async function registerCategoryRoutes(app: FastifyInstance) {
  app.get("/api/categories", async () => {
    return CATEGORIES;
  });
}
