import { z } from "zod";

export type ApiErrorBody = {
  error: {
    message: string;
    kind: "VALIDATION" | "UPSTREAM" | "UNKNOWN";
  };
};

export function validationError(message: string): ApiErrorBody {
  return { error: { message, kind: "VALIDATION" } };
}

export function upstreamError(message: string): ApiErrorBody {
  return { error: { message, kind: "UPSTREAM" } };
}

export function unknownError(message: string): ApiErrorBody {
  return { error: { message, kind: "UNKNOWN" } };
}

export function zodErrorMessage(err: z.ZodError): string {
  const issues = err.issues.slice(0, 3).map((i) => {
    const path = i.path.length ? i.path.join(".") : "input";
    return `${path}: ${i.message}`;
  });
  return issues.join("; ");
}
