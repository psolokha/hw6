import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";

// Импорт из скомпилированного dist: функцию Vercel бандлит esbuild,
// который не резолвит ESM-импорты с расширением .js в исходники .ts.
// Поэтому импортируем уже собранный (npm run build) JS.
import { buildApp } from "../dist/app.js";

let appReadyPromise: ReturnType<typeof initApp> | null = null;

async function initApp() {
  const app = await buildApp();
  await app.ready();
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!appReadyPromise) appReadyPromise = initApp();
  const app = await appReadyPromise;
  // Передаём входящий запрос напрямую в Fastify без открытия порта (listen).
  app.server.emit("request", req, res);
}
