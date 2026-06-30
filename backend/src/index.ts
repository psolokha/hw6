import "dotenv/config";
import { z } from "zod";

import { buildApp } from "./app.js";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  // На облачных хостингах нужно слушать 0.0.0.0, локально — 127.0.0.1.
  HOST: z.string().default(process.env.VERCEL ? "0.0.0.0" : "127.0.0.1"),
});

const env = envSchema.parse(process.env);

const app = await buildApp();
await app.listen({ port: env.PORT, host: env.HOST });
