import type { FastifyInstance } from "fastify";

import { verifyBearerToken } from "../middleware/auth.js";

export async function registerAuthRoutes(app: FastifyInstance) {
  // Возвращает профиль из Supabase JWT (в т.ч. после OAuth2).
  app.get("/api/auth/me", async (req, reply) => {
    const user = await verifyBearerToken(req.headers.authorization);
    if (!user) {
      req.log.warn({ event: "auth_failed", route: "/api/auth/me" }, "unauthorized");
      return reply.status(401).send({ error: { message: "Не авторизован", kind: "UNKNOWN" } });
    }

    req.log.info({ event: "auth_ok", userId: user.id, provider: user.provider ?? null }, "auth me");

    return {
      id: user.id,
      email: user.email ?? null,
      provider: user.provider ?? null,
    };
  });
}
