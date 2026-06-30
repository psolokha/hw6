import type { FastifyInstance } from "fastify";

import { runHealthChecks } from "../../core/health-checks.js";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/api/health", async (_req, reply) => {
    const health = await runHealthChecks();
    reply.status(health.ok ? 200 : 503).send(health);
  });
}
