export function withBasePath(url: string): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim()

  if (!basePath) return url
  if (!url) return url

  // Don't touch absolute URLs (http, https, protocol-relative).
  if (/^(https?:)?\/\//i.test(url)) return url

  const base = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath
  const path = url.startsWith("/") ? url : `/${url}`
  return `${base}${path}`
}
