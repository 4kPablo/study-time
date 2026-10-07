import {
  createServerClient as createSupabaseServerClient,
  type CookieOptions,
} from "@supabase/ssr";

export function createServerClient(request: Request, response: Response) {
  return createSupabaseServerClient(
    import.meta.env["SUPABASE_URL"],
    import.meta.env["SUPABASE_SECRET_KEY"],
    {
      cookies: {
        getAll() {
          return (
            request.headers
              .get("cookie")
              ?.split("; ")
              .map((cookie) => {
                const [name, ...rest] = cookie.split("=");
                return name ? { name, value: rest.join("=") } : null;
              }) ?? []
          ).filter((cookie): cookie is { name: string; value: string } => cookie !== null);
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>,
          headers: Record<string, string>,
        ) {
          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.headers.append(
              "Set-Cookie",
              `${name}=${value}; ${serializeCookieOptions(options)}`,
            );
          });
        },
      },
    },
  );
}

function serializeCookieOptions(options?: CookieOptions): string {
  if (!options) return "";
  const parts = [];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.secure) parts.push("Secure");
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join("; ");
}
