"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectTo = (path: string) => {
      window.location.replace(path);
    };

    const run = async () => {
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
        redirectTo(`/auth/login?${params.toString()}`);
        return;
      }

      const code = searchParams.get("code");
      if (!code) {
        redirectTo("/auth/login?error=auth_failed&reason=Missing+authorization+code");
        return;
      }

      const supabase = createClient();
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const exchangePromise = supabase.auth.exchangeCodeForSession(code);
      const timeoutPromise = new Promise<{ error: Error }>((resolve) => {
        timeoutId = setTimeout(
          () => resolve({ error: new Error("OAuth exchange timed out. Please try again.") }),
          30000
        );
      });

      const result = await Promise.race([exchangePromise, timeoutPromise]);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const error = result.error ?? null;

      if (error) {
        redirectTo(`/auth/login?error=auth_failed&reason=${encodeURIComponent(error.message)}`);
        return;
      }

      redirectTo(next);
    };

    run();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-dark-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-dark-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
