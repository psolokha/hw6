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

export type AuthUser = {
  id: string;
  email?: string;
  provider?: string;
};

function parseAuthUser(payload: Record<string, unknown>): AuthUser | null {
  const sub = payload.sub;
  if (typeof sub !== "string" || !sub) return null;

  const email = typeof payload.email === "string" ? payload.email : undefined;
  const appMeta =
    payload.app_metadata && typeof payload.app_metadata === "object"
      ? (payload.app_metadata as Record<string, unknown>)
      : undefined;
  const provider = appMeta && typeof appMeta.provider === "string" ? appMeta.provider : undefined;

  const user: AuthUser = { id: sub };
  if (email) user.email = email;
  if (provider) user.provider = provider;
  return user;
}

export async function verifyBearerToken(authHeader: string | undefined): Promise<AuthUser | null> {
  if (!authHeader) return null;
  const m = /^Bearer\s+(.+)$/.exec(authHeader);
  if (!m) return null;

  const token = m[1];
  if (!token) return null;

  const cfg = getJwtConfig();
  if (!cfg) return null;

  try {
    const { payload } = await jwtVerify(token, cfg.jwks, { issuer: cfg.issuer });
    return parseAuthUser(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function requireUserIdFromBearer(
  authHeader: string | undefined,
): Promise<string | null> {
  const user = await verifyBearerToken(authHeader);
  return user?.id ?? null;
}
