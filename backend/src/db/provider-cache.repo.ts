import { z } from "zod";

import { getSupabaseAdmin } from "./supabase.js";

const rowSchema = z.object({
  cache_key: z.string(),
  response: z.unknown(),
  expires_at: z.string(),
});

export async function getProviderCache<T>(cacheKey: string): Promise<T | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("provider_cache")
    .select("cache_key,response,expires_at")
    .eq("cache_key", cacheKey)
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = rowSchema.parse(data);
  return row.response as T;
}

export async function setProviderCache(params: {
  cacheKey: string;
  provider: string;
  kind: string;
  request: unknown;
  response: unknown;
  ttlSeconds: number;
}) {
  const supabaseAdmin = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + params.ttlSeconds * 1000).toISOString();

  const { error } = await supabaseAdmin.from("provider_cache").upsert(
    {
      cache_key: params.cacheKey,
      provider: params.provider,
      kind: params.kind,
      request: params.request,
      response: params.response,
      expires_at: expiresAt,
    },
    { onConflict: "cache_key" },
  );

  if (error) throw error;
}
