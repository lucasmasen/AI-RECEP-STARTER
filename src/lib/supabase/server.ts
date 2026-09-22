import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * True when the Supabase environment variables are actually present.
 *
 * Exists so the public landing page can render on a fresh deploy that has no
 * env vars set yet — a marketing page shouldn't 500 because the database isn't
 * wired up. Pages that need a real session check this and treat false as
 * "signed out".
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Supabase client for Server Components, Route Handlers and Server Actions.
 * cookies() is async in Next 16, so this is too — await it at every call site.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't set cookies. Harmless here: proxy.ts
            // refreshes the session on every request, so the write it's
            // rejecting has already happened there.
          }
        },
      },
    },
  );
}
