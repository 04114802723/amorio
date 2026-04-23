"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
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
        router.replace(`/auth/login?${params.toString()}`);
        return;
      }

      const code = searchParams.get("code");
      if (!code) {
        router.replace("/auth/login?error=auth_failed&reason=Missing+authorization+code");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        router.replace(`/auth/login?error=auth_failed&reason=${encodeURIComponent(error.message)}`);
        return;
      }

      router.replace(next);
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
