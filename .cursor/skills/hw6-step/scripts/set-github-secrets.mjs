#!/usr/bin/env node
/**
 * Устанавливает GitHub Actions secrets для HW6 из локальных .env.
 * Требует: PAT с Secrets: Read and write (в mcp.json или GITHUB_TOKEN).
 * Не печатает значения секретов.
 *
 * Usage (из корня репозитория):
 *   node .cursor/skills/hw6-step/scripts/set-github-secrets.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sodium from "libsodium-wrappers"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "../../../..")
const OWNER = "psolokha"
const REPO = "hw6"
const API = "https://api.github.com"

function parseEnv(filePath) {
  const out = {}
  if (!fs.existsSync(filePath)) return out
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, "")
    if (!line || line.startsWith("#")) continue
    const i = line.indexOf("=")
    if (i < 0) continue
    out[line.slice(0, i).trim()] = line.slice(i + 1)
  }
  return out
}

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim()
  const mcpPath = path.join(process.env.USERPROFILE || process.env.HOME || "", ".cursor/mcp.json")
  if (!fs.existsSync(mcpPath)) throw new Error("GITHUB_TOKEN not set and mcp.json not found")
  const mcp = JSON.parse(fs.readFileSync(mcpPath, "utf8"))
  return String(mcp.mcpServers.github.headers.Authorization)
    .replace(/^Bearer\s+/i, "")
    .trim()
}

const be = parseEnv(path.join(REPO_ROOT, "backend/.env"))
const fe = parseEnv(path.join(REPO_ROOT, "frontend/.env.local"))

const secrets = {
  SUPABASE_URL: be.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: be.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWKS_URL: be.SUPABASE_JWKS_URL,
  NEXT_PUBLIC_SUPABASE_URL: fe.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: fe.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  TEST_USER_EMAIL: be.TEST_USER_EMAIL,
  TEST_USER_PASSWORD: be.TEST_USER_PASSWORD,
}

const token = getToken()
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "hw6-set-github-secrets",
}

const pkRes = await fetch(`${API}/repos/${OWNER}/${REPO}/actions/secrets/public-key`, { headers })
if (!pkRes.ok) {
  console.error(`Failed to get public key: HTTP ${pkRes.status}`)
  console.error(await pkRes.text())
  process.exit(1)
}
const pk = await pkRes.json()

await sodium.ready
const keyBytes = sodium.from_base64(pk.key, sodium.base64_variants.ORIGINAL)

let ok = 0
let fail = 0
for (const [name, value] of Object.entries(secrets)) {
  if (!value) {
    console.log(`SKIP  ${name}`)
    fail++
    continue
  }
  const enc = sodium.crypto_box_seal(sodium.from_string(value), keyBytes)
  const encrypted_value = sodium.to_base64(enc, sodium.base64_variants.ORIGINAL)
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/actions/secrets/${name}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ encrypted_value, key_id: pk.key_id }),
  })
  if (res.ok) {
    console.log(`OK    ${name}: HTTP ${res.status}`)
    ok++
  } else {
    console.log(`ERR   ${name}: HTTP ${res.status}`)
    fail++
  }
}
console.log(`---\nDone: ${ok} ok, ${fail} failed/skipped`)
process.exit(fail > 0 ? 1 : 0)
