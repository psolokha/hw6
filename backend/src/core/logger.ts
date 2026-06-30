import type { FastifyServerOptions } from "fastify";
import { z } from "zod";

import { LOG_REDACT_PATHS, sanitizeHeaders, serializeError } from "./log-sanitize.js";

const logEnvSchema = z.object({
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).optional(),
  NODE_ENV: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
});

function resolveLogLevel(): string {
  const { LOG_LEVEL, NODE_ENV } = logEnvSchema.parse(process.env);
  if (LOG_LEVEL) return LOG_LEVEL;
  return NODE_ENV === "production" ? "info" : "debug";
}

/** Конфигурация Pino для Fastify: JSON, уровни, redact секретов/PII. */
export function createLoggerOptions(): NonNullable<FastifyServerOptions["logger"]> {
  const { VERCEL_GIT_COMMIT_SHA, NODE_ENV } = logEnvSchema.parse(process.env);

  return {
    level: resolveLogLevel(),
    redact: {
      paths: LOG_REDACT_PATHS,
      censor: "[REDACTED]",
    },
    base: {
      service: "nearstep-backend",
      env: NODE_ENV ?? "development",
      ...(VERCEL_GIT_COMMIT_SHA ? { commit: VERCEL_GIT_COMMIT_SHA.slice(0, 7) } : {}),
    },
    serializers: {
      req(request) {
        return {
          id: request.id,
          method: request.method,
          url: request.url,
          path: request.routeOptions?.url,
          query: request.query,
          remoteAddress: request.ip,
          headers: sanitizeHeaders(request.headers),
        };
      },
      res(reply) {
        return {
          statusCode: reply.statusCode,
        };
      },
      err(err) {
        const serialized = serializeError(err);
        return {
          type: serialized.type,
          message: serialized.message,
          stack: serialized.stack ?? "",
          ...(serialized.code ? { code: serialized.code } : {}),
        };
      },
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  };
}
