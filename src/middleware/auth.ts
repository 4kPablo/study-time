import { createServerClient } from "@/lib/supabase/server";

export async function getUser(request: Request, response: Response) {
  const supabase = createServerClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getOptionalUser(request: Request, response: Response) {
  const supabase = createServerClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user: user ?? null };
}
