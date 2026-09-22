import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS, so it is only ever constructed inside the
 * Stripe webhook — the one place that legitimately writes to a row on behalf of
 * a user who isn't the one making the request.
 *
 * Never import this into a Client Component. The key must not reach the browser.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
