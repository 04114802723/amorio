import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/app";

  if (oauthError) {
    const params = new URLSearchParams({
      error: "oauth_error",
      reason: oauthError,
    });
    if (oauthErrorDescription) {
      params.set("message", oauthErrorDescription);
    }
    return NextResponse.redirect(`${origin}/auth/login?${params.toString()}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    const params = new URLSearchParams({
      error: "auth_failed",
      reason: error.message,
    });
    return NextResponse.redirect(`${origin}/auth/login?${params.toString()}`);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
