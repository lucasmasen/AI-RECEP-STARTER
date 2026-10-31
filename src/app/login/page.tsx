import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { logSupabaseConfigState } from "@/lib/supabase/config";
import { SiteFooter, SiteHeader } from "@/components/brand";

// Always render per request. These pages branch on environment variables that
// are resolved at runtime, so letting Next prerender them bakes in whichever
// branch was true at BUILD time. Deploy before setting env vars, and the page
// says "not configured" forever, even once the values are live. The landing
// page stays static on purpose; it's the one that benefits from being cached.
export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  if (!isSupabaseConfigured()) {
    // Names, never values, so it's safe in Vercel's Runtime Logs. Turns "it says
    // not configured" into "it found these three names and none of them match".
    logSupabaseConfigState("/login");
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          &larr; Shutoff Call
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">Not configured yet</h1>
        <p className="mt-3 text-sm text-muted">
          This deployment has no Supabase credentials set, so there is nothing to sign in
          to. See the README for the four environment variables it needs.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const message = typeof params.error === "string" ? params.error : null;
  const notice = typeof params.notice === "string" ? params.notice : null;

  async function signIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
    redirect("/dashboard");
  }

  async function signUp(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

    // With email confirmation on, there's no session yet. The user has to click
    // the link first. With it off, they're already signed in.
    if (data.session) redirect("/dashboard");
    redirect(`/login?notice=${encodeURIComponent("Check your email to confirm the account.")}`);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-start justify-center px-5 pt-12 pb-24 sm:pt-20">
        <div className="w-full max-w-md">
          <div className="card p-7 sm:p-8">
            <p className="eyebrow">Callback drafter</p>
            <h1 className="mt-3 text-3xl font-bold">Sign in</h1>
            <p className="mt-2 text-muted">
              New here? Enter an email and a password, then hit Create account. Five drafts a
              month are free.
            </p>

            {message && (
              <p role="alert" className="mt-6 rounded-lg border border-missed/30 bg-missed/10 px-4 py-3 text-sm text-missed">
                {message}
              </p>
            )}
            {notice && (
              <p className="mt-6 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
                {notice}
              </p>
            )}

            <form className="mt-7 flex flex-col gap-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Email</span>
                <input name="email" type="email" required autoComplete="email" inputMode="email" className="field" placeholder="you@yourshop.com" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Password</span>
                <input name="password" type="password" required minLength={6} autoComplete="current-password" className="field" placeholder="At least 6 characters" />
              </label>

              <div className="mt-1 flex flex-col gap-3 sm:flex-row">
                <button formAction={signIn} className="btn-primary flex-1">
                  Sign in
                </button>
                <button formAction={signUp} className="btn-ghost flex-1">
                  Create account
                </button>
              </div>
            </form>
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            Looking for the AI receptionist?{" "}
            <Link href="/demo" className="font-semibold text-accent underline-offset-4 hover:underline">
              Hear Godfrey answer a call
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
