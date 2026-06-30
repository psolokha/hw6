import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";

const envSchema = z.object({
  SUPABASE_JWKS_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
});

function getJwtConfig(): { jwks: ReturnType<typeof createRemoteJWKSet>; issuer: string } | null {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) return null;
  const env = parsed.data;
  return {
    jwks: createRemoteJWKSet(new URL(env.SUPABASE_JWKS_URL)),
    issuer: `${env.SUPABASE_URL}/auth/v1`,
  };
}

export async function requireUserIdFromBearer(
  authHeader: string | undefined,
): Promise<string | null> {
  if (!authHeader) return null;
  const m = /^Bearer\s+(.+)$/.exec(authHeader);
  if (!m) return null;

  const token = m[1];
  if (!token) return null;

  const cfg = getJwtConfig();
  if (!cfg) return null;

  try {
    const { payload } = await jwtVerify(token, cfg.jwks, { issuer: cfg.issuer });
    const sub = payload.sub;
    if (typeof sub !== "string" || !sub) return null;
    return sub;
  } catch {
    return null;
  }
}
