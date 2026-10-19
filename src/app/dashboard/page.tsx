import { redirect } from "next/navigation";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getUsage } from "@/lib/plan";
import type { MissedCall } from "@/lib/types";

import DraftForm from "./draft-form";
import CallList from "./call-list";
import UpgradeButton from "./upgrade-button";
import { Wordmark } from "@/components/brand";

// Always render per request. These pages branch on environment variables that
// are resolved at runtime, so letting Next prerender them bakes in whichever
// branch was true at BUILD time. Deploy before setting env vars, and the page
// says "not configured" forever, even once the values are live. The landing
// page stays static on purpose; it's the one that benefits from being cached.
export const dynamic = "force-dynamic";

export const metadata = { title: "Callback drafter" };

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [usage, { data: calls }] = await Promise.all([
    getUsage(supabase, user.id),
    supabase
      .from("missed_calls")
      .select("id, caller_number, context, drafts, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  // Stripe isn't configured on every deployment. Without it the button can only fail, so hide it.
  const canUpgrade = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
  const usedShare = usage.limit ? Math.min(1, usage.used / usage.limit) : 0;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-5">
          <Wordmark />
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden max-w-[16rem] truncate text-muted sm:inline">{user.email}</span>
            <form action={signOut}>
              <button className="rounded-md px-2 py-1 text-muted transition hover:text-foreground">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-10 pb-24">
        <p className="eyebrow">Callback drafter</p>
        <h1 className="mt-2 text-3xl font-bold">Turn a missed call into a text worth sending.</h1>

        <section className="card mt-8 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm">
              {usage.plan === "pro" ? (
                <>
                  <span className="font-semibold">Pro</span>
                  <span className="text-muted"> · unlimited drafts</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">
                    {usage.remaining} of {usage.limit} free drafts left
                  </span>
                  <span className="text-muted"> this month</span>
                </>
              )}
            </p>
            {usage.plan === "free" && canUpgrade && <UpgradeButton />}
          </div>
          {usage.plan === "free" && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-accent-soft" aria-hidden="true">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${usedShare * 100}%` }} />
            </div>
          )}
        </section>

        <DraftForm outOfDrafts={usage.remaining === 0} />

        <CallList calls={(calls ?? []) as MissedCall[]} />
      </main>
    </>
  );
}
