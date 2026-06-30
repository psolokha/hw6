import { z } from "zod";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly bodyText: string,
  ) {
    super(message);
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const attempt = async (): Promise<T> => {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
    const text = await res.text();

    if (!res.ok) {
      throw new HttpError(`HTTP ${res.status} for ${url}`, res.status, text);
    }

    return z.unknown().parse(JSON.parse(text)) as T;
  };

  try {
    return await attempt();
  } catch (e) {
    const retryable =
      e instanceof HttpError && (e.status === 429 || e.status === 504 || e.status === 502);
    if (!retryable) throw e;
    await new Promise((r) => setTimeout(r, 3_000));
    return await attempt();
  }
}
