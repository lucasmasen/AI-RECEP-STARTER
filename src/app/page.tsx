import Link from "next/link";

import CallCard from "@/components/call-card";
import { SiteFooter, SiteHeader } from "@/components/brand";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const STEPS = [
  {
    title: "Your phone rings and you can't pick up",
    body: "Your carrier forwards only the calls you don't answer, after about four rings. You keep your number, and turning it off is one code from your phone.",
  },
  {
    title: "Godfrey answers for your shop",
    body: "He says up front that he's your AI assistant. On an emergency he walks the caller through the shut-off. If they smell gas, he tells them to get out and call 911 or PG&E.",
  },
  {
    title: "You get the details while they're still on the line",
    body: "Name, callback number, address or cross street, and what's wrong. You call back before they call someone else.",
  },
];

const WONT = [
  {
    title: "Pretend to be a person",
    body: "Every call opens with “this is Godfrey, the shop's AI assistant,” and says the call may be recorded before anything else.",
  },
  {
    title: "Quote your prices",
    body: "Unless you tell it to, it says the plumber quotes after seeing the job.",
  },
  {
    title: "Promise an arrival time",
    body: "It takes the caller's preferred time and says the office will confirm it.",
  },
  {
    title: "Say help is coming when it isn't",
    body: "If the alert to you doesn't go through, Godfrey says so and promises nothing.",
  },
];

const BUILD_NOTES = [
  "The alert to the owner counts as sent only when a channel confirms it. Otherwise the caller hears the truth.",
  "Scripted callers (burst pipe, gas, price haggling, “am I talking to a person?”) run against the real prompt before a change ships.",
  "Each shop gets its own assistant, number and alert channel, with a fallback so an alert never goes nowhere.",
  "212 Python and 20 TypeScript tests, plus a scheduled health check on every live line.",
];

export default async function Home() {
  // Public page: a missing or unreachable Supabase just means "signed out" here.
  let signedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  }

  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main className="flex-1 overflow-x-clip">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pt-14 pb-20 md:grid-cols-[1.1fr_1fr] md:pt-24 md:pb-28">
          <div>
            <p className="eyebrow">For plumbers and trade shops</p>
            <h1 className="mt-4 text-[2.6rem] leading-[1.04] font-extrabold sm:text-6xl">
              You&apos;re under a sink. Your phone is ringing.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Someone with water on the floor doesn&apos;t leave a voicemail. They call the next
              plumber. Godfrey answers the calls you miss, helps the caller shut their water off,
              and sends you their details before they hang up.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/demo" className="btn-primary px-6 py-3.5 text-base">
                Hear Godfrey answer a call
                <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link href="#how" className="btn-ghost px-6 py-3.5 text-base">
                How it works
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">
              Two minutes, from your own phone. He answers as a made-up shop.
            </p>
          </div>
          <CallCard />
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-y border-border bg-card/60">
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">
              You still get first shot at every call.
            </h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="card p-6">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-accent font-display text-base font-bold text-accent-ink">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                  <p className="mt-2.5 leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Honest by design */}
        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow">Straight answers</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">What it won&apos;t do.</h2>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
                A receptionist that makes things up is worse than voicemail. These are hard
                rules, and each one has a test.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {WONT.map((item) => (
                <li key={item.title} className="rounded-2xl border border-border p-5">
                  <p className="flex items-center gap-2 font-semibold">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-missed/12 text-missed" aria-hidden="true">
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 3l6 6M9 3l-6 6" />
                      </svg>
                    </span>
                    {item.title}
                  </p>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Callback drafter */}
        <section id="drafter" className="scroll-mt-20 border-y border-border bg-card/60">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
            <div>
              <p className="eyebrow">Free tool</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Already missed it? Text back in ten seconds.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted">
                Paste the voicemail or a note to yourself. Get three callback texts you can
                actually send, in your voice, with no invented prices or arrival times and one
                clear next step for the customer.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={signedIn ? "/dashboard" : "/login"} className="btn-ghost">
                  {signedIn ? "Open the drafter" : "Try the drafter free"}
                </Link>
                <span className="text-sm text-muted">5 drafts a month free. No card.</span>
              </div>
            </div>
            <div className="card p-6">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                Missed call · (415) 555-0142
              </p>
              <p className="mt-2 text-sm text-muted">
                Water heater leaking into the garage, wants someone today.
              </p>
              <div className="mt-4 rounded-xl bg-background p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-muted uppercase">Direct</span>
                  <span className="rounded-full border border-missed/40 px-2 py-0.5 text-xs text-missed">
                    Emergency
                  </span>
                </div>
                <p className="mt-2 font-mono text-[0.85rem] leading-relaxed">
                  This is Mike at Bayview Plumbing, sorry I missed you. A leaking heater can get
                  worse fast, so shut the water valve on top of the tank if you can reach it. I
                  can call you right back to lock in a time. Are you free in the next 20
                  minutes?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Under the hood */}
        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow">Under the hood</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Built to never fake it.</h2>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
                Vapi for the voice, Claude for the conversation, Supabase for alerts and call
                logs. The code is public.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Vapi", "Claude", "Supabase", "Next.js", "Python", "TypeScript"].map((t) => (
                  <span key={t} className="rounded-full border border-border px-3 py-1 font-mono text-xs">
                    {t}
                  </span>
                ))}
              </div>
              <a
                href="https://github.com/lucasmasen/AI-RECEP-DEMO"
                className="mt-7 inline-flex items-center gap-2 font-semibold text-accent underline-offset-4 hover:underline"
              >
                Read the receptionist&apos;s source <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
            <ul className="flex flex-col gap-3">
              {BUILD_NOTES.map((note) => (
                <li key={note} className="flex gap-3 rounded-2xl border border-border p-5 leading-relaxed">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span className="text-muted">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-5 pb-24">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 rounded-3xl bg-foreground px-8 py-12 text-background sm:flex-row sm:items-center sm:justify-between sm:px-12">
            <div>
              <h2 className="text-3xl font-bold">Hear it for yourself.</h2>
              <p className="mt-2 max-w-lg text-background/75">
                Call the demo line and pretend your pipe just burst. It takes two minutes.
              </p>
            </div>
            <Link href="/demo" className="btn-brass px-6 py-3.5 text-base">
              Get the demo number <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
