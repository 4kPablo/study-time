import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthCallbackSearch {
  code?: string;
  next?: string;
  error?: string;
  error_description?: string;
}

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search) => search as AuthCallbackSearch,
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/callback" }) as AuthCallbackSearch;
  const next = search.next || "/";

  useEffect(() => {
    let active = true;

    const completeSignIn = async () => {
      const authError = search.error_description || search.error;
      if (authError) {
        navigate({ to: "/auth/login", search: { error: authError } });
        return;
      }

      if (!search.code || !isSupabaseConfigured()) {
        navigate({
          to: "/auth/login",
          search: { error: "No se pudo completar el inicio de sesión con Google." },
        });
        return;
      }

      try {
        const {
          data: { session },
          error,
        } = await createClient().auth.getSession();

        if (error) throw error;
        if (!session) throw new Error("Google no devolvió una sesión válida.");

        if (active) navigate({ to: next, replace: true });
      } catch (error) {
        console.error("Auth callback error:", error);
        if (active) {
          navigate({
            to: "/auth/login",
            search: {
              error:
                error instanceof Error
                  ? error.message
                  : "No se pudo completar el inicio de sesión con Google.",
            },
          });
        }
      }
    };

    void completeSignIn();

    return () => {
      active = false;
    };
  }, [navigate, next, search.code, search.error, search.error_description]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-muted-foreground">Completando inicio de sesión...</p>
      </div>
    </div>
  );
}
