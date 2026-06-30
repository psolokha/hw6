import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function getSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase env for OAuth callback")
  }
  return createClient(url, key)
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const oauthError = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const next = requestUrl.searchParams.get("next") ?? "/catalog"

  if (oauthError) {
    const msg = errorDescription ?? oauthError
    return NextResponse.redirect(
      new URL(`/catalog?auth_error=${encodeURIComponent(msg)}`, requestUrl.origin),
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL("/catalog", requestUrl.origin))
  }

  try {
    const supabase = getSupabaseAuthClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        new URL(`/catalog?auth_error=${encodeURIComponent(error.message)}`, requestUrl.origin),
      )
    }
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OAuth callback failed"
    return NextResponse.redirect(
      new URL(`/catalog?auth_error=${encodeURIComponent(msg)}`, requestUrl.origin),
    )
  }
}
