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
}

export default nextConfig
