import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Интеграция с backend требует runtime (не static export).
  // Указываем корень фронтенда, чтобы Next не пытался “угадать” его по lockfile в workspace root.
  turbopack: {
    root: __dirname,
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Playwright (и иногда прокси) могут открывать dev-сервер по `127.0.0.1`.
  // Без этого Next.js блокирует доступ к dev-ресурсам (HMR), из-за чего клиентская гидратация не происходит.
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://hw6-ac72.vercel.app"
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co"
    const supabaseHost = (() => {
      try {
        return new URL(supabaseUrl).host
      } catch {
        return "*.supabase.co"
      }
    })()

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      `connect-src 'self' ${backendUrl} https://${supabaseHost} wss://${supabaseHost} https://va.vercel-scripts.com https://accounts.google.com`,
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api-maps.yandex.ru https://yastatic.net https://va.vercel-scripts.com",
    ].join("; ")

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ]
  },
}

export default nextConfig
