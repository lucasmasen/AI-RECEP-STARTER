import { createClient } from "@supabase/supabase-js";

import { supabaseServiceRoleKey, supabaseUrl } from "./config";

/**
 * Service-role client. Bypasses RLS, so it is only constructed in two server
 * routes: the Stripe webhook (it writes a plan change for a user who isn't the
 * one making the request) and /api/demo-access (the only caller allowed to run
 * request_demo_access, after its own bot checks).
 *
 * Never import this into a Client Component. The key must not reach the browser.
 */
export function createAdminClient() {
  const key = supabaseServiceRoleKey();
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createClient(supabaseUrl()!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
