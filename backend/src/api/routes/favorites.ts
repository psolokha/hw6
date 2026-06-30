import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { FavoritesEntryDTO } from "../../core/contracts.js";
import { requireUserIdFromBearer } from "../middleware/auth.js";
import { unknownError, zodErrorMessage, validationError } from "../errors.js";
import {
  addFavorite,
  listFavorites,
  removeFavorite,
  syncFavorites,
} from "../../db/favorites.repo.js";

const favoritesEntrySchema: z.ZodType<FavoritesEntryDTO> = z.union([
  z.object({
    type: z.literal("poi"),
    id: z.string().min(1),
    createdAtIso: z.string().min(1),
    poi: z.any(),
  }),
  z.object({
    type: z.literal("route"),
    id: z.string().min(1),
    createdAtIso: z.string().min(1),
    route: z.any(),
    title: z.string().optional(),
  }),
]);

export async function registerFavoritesRoutes(app: FastifyInstance) {
  app.get("/api/favorites", async (req, reply) => {
    const userId = await requireUserIdFromBearer(req.headers.authorization);
    if (!userId)
      return reply.status(401).send({ error: { message: "Не авторизован", kind: "UNKNOWN" } });

    try {
      return await listFavorites(userId);
    } catch (e) {
      req.log.error({ err: e }, "list favorites failed");
      return reply.status(500).send(unknownError("Не удалось загрузить избранное"));
    }
  });

  app.post("/api/favorites", async (req, reply) => {
    const userId = await requireUserIdFromBearer(req.headers.authorization);
    if (!userId)
      return reply.status(401).send({ error: { message: "Не авторизован", kind: "UNKNOWN" } });

    const parsed = favoritesEntrySchema.safeParse(req.body);
    if (!parsed.success)
      return reply.status(400).send(validationError(zodErrorMessage(parsed.error)));

    try {
      await addFavorite(userId, parsed.data);
      return { ok: true };
    } catch (e) {
      req.log.error({ err: e }, "add favorite failed");
      return reply.status(500).send(unknownError("Не удалось сохранить избранное"));
    }
  });

  app.delete("/api/favorites/:id", async (req, reply) => {
    const userId = await requireUserIdFromBearer(req.headers.authorization);
    if (!userId)
      return reply.status(401).send({ error: { message: "Не авторизован", kind: "UNKNOWN" } });

    const parsed = z.object({ id: z.string().min(1).max(200) }).safeParse(req.params);
    if (!parsed.success)
      return reply.status(400).send(validationError(zodErrorMessage(parsed.error)));

    try {
      await removeFavorite(userId, parsed.data.id);
      return { ok: true };
    } catch (e) {
      req.log.error({ err: e }, "remove favorite failed");
      return reply.status(500).send(unknownError("Не удалось удалить из избранного"));
    }
  });

  app.post("/api/favorites/sync", async (req, reply) => {
    const userId = await requireUserIdFromBearer(req.headers.authorization);
    if (!userId)
      return reply.status(401).send({ error: { message: "Не авторизован", kind: "UNKNOWN" } });

    const parsed = z.array(favoritesEntrySchema).safeParse(req.body);
    if (!parsed.success)
      return reply.status(400).send(validationError(zodErrorMessage(parsed.error)));

    try {
      const res = await syncFavorites(userId, parsed.data);
      return res;
    } catch (e) {
      req.log.error({ err: e }, "sync favorites failed");
      return reply.status(500).send(unknownError("Не удалось синхронизировать избранное"));
    }
  });
}
