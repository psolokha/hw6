import { z } from "zod";

import type { FavoritesEntryDTO } from "../core/contracts.js";
import { getSupabaseAdmin } from "./supabase.js";

const rowSchema = z.object({
  id: z.string(),
  type: z.union([z.literal("poi"), z.literal("route")]),
  payload: z.unknown(),
  created_at: z.string(),
});

function normalizeEntry(row: z.infer<typeof rowSchema>): FavoritesEntryDTO | null {
  const createdAtIso = row.created_at;

  // We store only { poi } or { route, title? } in payload.
  if (row.type === "poi") {
    const parsed = z
      .object({
        poi: z.any(),
      })
      .safeParse(row.payload);
    if (!parsed.success) return null;
    return {
      type: "poi",
      id: row.id,
      createdAtIso,
      poi: parsed.data.poi,
    };
  }

  const parsed = z
    .object({
      route: z.any(),
      title: z.string().optional(),
    })
    .safeParse(row.payload);
  if (!parsed.success) return null;

  return {
    type: "route",
    id: row.id,
    createdAtIso,
    route: parsed.data.route,
    ...(parsed.data.title ? { title: parsed.data.title } : {}),
  };
}

function dedupeKey(entry: FavoritesEntryDTO): string {
  if (entry.type === "poi") return `poi:${entry.poi?.id ?? entry.id}`;
  return `route:${entry.route?.id ?? entry.id}`;
}

export async function listFavorites(userId: string): Promise<FavoritesEntryDTO[]> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("favorites")
    .select("id,type,payload,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const rows = z.array(rowSchema).parse(data ?? []);
  return rows.map(normalizeEntry).filter(Boolean) as FavoritesEntryDTO[];
}

export async function addFavorite(userId: string, entry: FavoritesEntryDTO): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  // Dedupe in app layer. Since service role bypasses RLS, scope all queries by user_id.
  const existing = await listFavorites(userId);
  const key = dedupeKey(entry);
  if (existing.some((e) => dedupeKey(e) === key)) return;

  const payload =
    entry.type === "poi"
      ? { poi: entry.poi }
      : {
          route: entry.route,
          ...(entry.title ? { title: entry.title } : {}),
        };

  const { error } = await supabaseAdmin.from("favorites").insert({
    user_id: userId,
    type: entry.type,
    payload,
  });
  if (error) throw error;
}

export async function removeFavorite(userId: string, favoriteId: string): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("favorites")
    .delete()
    .eq("id", favoriteId)
    .eq("user_id", userId)
    .select("id");

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function syncFavorites(
  userId: string,
  entries: FavoritesEntryDTO[],
): Promise<{ imported: number; skipped: number }> {
  const existing = await listFavorites(userId);
  const existingKeys = new Set(existing.map(dedupeKey));

  let imported = 0;
  let skipped = 0;

  for (const entry of entries) {
    const key = dedupeKey(entry);
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }
    await addFavorite(userId, entry);
    existingKeys.add(key);
    imported++;
  }

  return { imported, skipped };
}
