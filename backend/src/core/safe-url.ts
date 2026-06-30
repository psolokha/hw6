/** Разрешаем только http(s) ссылки — защита от javascript: / data: в externalUrl. */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeHttpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return isSafeHttpUrl(value) ? value : undefined;
}
