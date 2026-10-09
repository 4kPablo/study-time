import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useState } from "react";

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
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const completeSignIn = async () => {
      const authError = search.error_description || search.error;
      if (authError) {
        setErrorMessage(authError);
        return;
      }

      if (!isSupabaseConfigured()) {
        setErrorMessage("No se pudo completar el inicio de sesión con Google.");
        return;
      }

      try {
        const {
          data: { session },
          error,
        } = await createClient().auth.getSession();

        if (error) throw error;
        if (!session) {
          throw new Error(
            search.code
              ? "Google no devolvió una sesión válida."
              : "No se encontró una sesión activa después de volver de Google.",
          );
        }

        if (active) navigate({ to: next, replace: true });
      } catch (error) {
        console.error("Auth callback error:", error);
        if (active)
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No se pudo completar el inicio de sesión con Google.",
          );
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
        {errorMessage ? (
          <>
            <h1 className="text-xl font-semibold text-foreground">No se pudo iniciar sesión</h1>
            <p className="mt-2 text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Volver al dashboard
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-muted-foreground">Completando inicio de sesión...</p>
          </>
        )}
      </div>
    </div>
  );
}
