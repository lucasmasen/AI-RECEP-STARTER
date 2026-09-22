import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getUsage } from "@/lib/plan";
import type { MissedCall } from "@/lib/types";

import DraftForm from "./draft-form";
import CallList from "./call-list";
import UpgradeButton from "./upgrade-button";

export default async function DashboardPage() {
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

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Missed Call Copilot</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="text-sm text-muted transition hover:text-foreground">
            Sign out
          </button>
        </form>
      </header>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
        <p className="text-sm">
          {usage.plan === "pro" ? (
            <>
              <span className="font-medium">Pro</span>
              <span className="text-muted"> · unlimited drafts</span>
            </>
          ) : (
            <>
              <span className="font-medium">
                {usage.remaining} of {usage.limit} drafts left
              </span>
              <span className="text-muted"> this month</span>
            </>
          )}
        </p>
        {usage.plan === "free" && <UpgradeButton />}
      </section>

      <DraftForm outOfDrafts={usage.remaining === 0} />

      <CallList calls={(calls ?? []) as MissedCall[]} />
    </main>
  );
}
