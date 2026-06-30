const SENSITIVE_HEADER_NAMES = new Set(["authorization", "cookie", "x-api-key", "x-supabase-key"]);

const SENSITIVE_FIELD_NAMES = new Set([
  "password",
  "token",
  "access_token",
  "refresh_token",
  "secret",
  "apikey",
  "api_key",
  "service_role_key",
  "supabase_service_role_key",
]);

/** Пути для pino redact — заголовки, тело запроса и вложенные секреты. */
export const LOG_REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "headers.authorization",
  "headers.cookie",
  "authorization",
  "cookie",
  "*.password",
  "*.token",
  "*.access_token",
  "*.refresh_token",
  "*.secret",
  "*.apiKey",
  "*.api_key",
  "*.service_role_key",
  "*.email",
];

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 1) return "[REDACTED_EMAIL]";
  return `${email.slice(0, 1)}***${email.slice(at)}`;
}

export function sanitizeHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    out[key] = SENSITIVE_HEADER_NAMES.has(key.toLowerCase()) ? "[REDACTED]" : value;
  }
  return out;
}

export function sanitizeObject(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[TRUNCATED]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value;
  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item, depth + 1));
  }

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_FIELD_NAMES.has(key.toLowerCase())) {
      out[key] = "[REDACTED]";
      continue;
    }
    if (key.toLowerCase() === "email" && typeof nested === "string") {
      out[key] = maskEmail(nested);
      continue;
    }
    out[key] = sanitizeObject(nested, depth + 1);
  }
  return out;
}

/** Безопасная сериализация ошибки для JSON-логов (без циклических ссылок). */
export function serializeError(err: unknown): {
  type: string;
  message: string;
  code?: string;
  stack?: string;
} {
  if (err instanceof Error) {
    const withCode = err as Error & { code?: string };
    const serialized: { type: string; message: string; code?: string; stack?: string } = {
      type: err.name,
      message: err.message,
    };
    if (withCode.code) serialized.code = withCode.code;
    if (process.env.NODE_ENV !== "production" && err.stack) serialized.stack = err.stack;
    return serialized;
  }

  return { type: "UnknownError", message: String(err) };
}
