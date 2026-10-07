import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthCallbackSearch {
  code?: string;
  next?: string;
  error?: string;
}

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search) => search as AuthCallbackSearch,
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/callback" }) as AuthCallbackSearch;
  const code = search.code;
  const next = search.next || "/";

  useEffect(() => {
    if (code && isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error("Auth callback error:", error);
          navigate({ to: "/auth/login", search: { error: error.message } });
        } else {
          navigate({ to: next });
        }
      });
    } else {
      navigate({ to: "/auth/login", search: { error: "Código de autorización faltante" } });
    }
  }, [code, navigate, next]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-muted-foreground">Completando inicio de sesión...</p>
      </div>
    </div>
  );
}
