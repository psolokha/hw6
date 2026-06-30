export type ApiErrorKind =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'UPSTREAM'
  | 'VALIDATION'
  | 'UNKNOWN'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly retryAfterMs?: number
  readonly details?: unknown

  constructor(
    message: string,
    opts: {
      kind: ApiErrorKind
      status?: number
      retryAfterMs?: number
      details?: unknown
      cause?: unknown
    }
  ) {
    super(message, { cause: opts.cause })
    this.name = 'ApiError'
    this.kind = opts.kind
    this.status = opts.status
    this.retryAfterMs = opts.retryAfterMs
    this.details = opts.details
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

