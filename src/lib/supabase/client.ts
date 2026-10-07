import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured() {
  return Boolean(import.meta.env["VITE_SUPABASE_URL"] && import.meta.env["VITE_SUPABASE_ANON_KEY"]);
}

export function createClient() {
  return createBrowserClient(
    import.meta.env["VITE_SUPABASE_URL"],
    import.meta.env["VITE_SUPABASE_ANON_KEY"],
  );
}
