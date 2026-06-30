/** Разрешаем только http(s) ссылки в пользовательских/внешних href. */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
