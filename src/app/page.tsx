import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function Home() {
  // The landing page is public and must render on a fresh deploy with no env
  // vars set, so a missing or unreachable Supabase is just "signed out" here.
  let user = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    ({
      data: { user },
    } = await supabase.auth.getUser());
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-20">
      <p className="text-sm font-medium tracking-wide text-accent uppercase">
        Missed Call Copilot
      </p>

      <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
        A missed call is a customer calling someone else in four minutes.
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-muted">
        Log the number and what the caller wanted. Get three callback texts you can
        actually send — written in your voice, with no invented prices, no made-up arrival
        times, and one clear next step for the customer.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href={user ? "/dashboard" : "/login"}
          className="rounded-lg bg-accent px-5 py-3 font-medium text-white transition hover:opacity-90"
        >
          {user ? "Open dashboard" : "Start free"}
        </Link>
        <span className="text-sm text-muted">
          5 drafts a month free. No card to start.
        </span>
      </div>

      <div className="mt-16 rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          What it writes
        </p>
        <p className="mt-3 text-sm text-muted">
          Missed call from (415) 555-0142 — water heater leaking into the garage, wants
          someone today
        </p>
        <p className="mt-4 rounded-lg bg-background p-4 font-mono text-sm leading-relaxed">
          This is Mike at Bayview Plumbing — sorry I missed you. A leaking heater can get
          worse fast, so shut the water valve on top of the tank if you can reach it. I can
          call you right back to lock in a time. Are you free in the next 20 minutes?
        </p>
      </div>
    </main>
  );
}
