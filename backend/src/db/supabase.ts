import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
});

// Схема БД не сгенерирована, поэтому типизируем клиент как `any`-Database,
// иначе supabase-js резолвит таблицы в `never` и ломает insert/upsert.
let cached: SupabaseClient<any> | null = null;

export function getSupabaseAdmin(): SupabaseClient<any> {
  if (cached) return cached;
  const env = envSchema.parse(process.env);
  cached = createClient<any>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}
