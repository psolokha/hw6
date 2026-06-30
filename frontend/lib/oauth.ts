import { supabase } from "@/lib/supabase-client"

export type OAuthProvider = "google"

function getOAuthRedirectUrl(): string {
  if (typeof window === "undefined") return "/auth/callback"
  return `${window.location.origin}/auth/callback`
}

export async function signInWithOAuth(provider: OAuthProvider): Promise<Error | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getOAuthRedirectUrl(),
      queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
    },
  })
  return error
}

export function formatOAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes("provider is not enabled")) {
    return "OAuth-провайдер не настроен в Supabase. См. integration_documentation.md."
  }
  if (lower.includes("access_denied") || lower.includes("denied")) {
    return "Вход отменён. Попробуйте снова или выберите другой способ."
  }
  return message
}
