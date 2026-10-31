import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/brand";
import DemoForm from "./demo-form";

export const metadata: Metadata = {
  title: "Hear Godfrey answer a call",
  description: "Call the demo line and hear an AI receptionist book a job or handle a burst pipe for a plumbing shop.",
};

const WHAT_HAPPENS = [
  "He tells you up front he's an AI and the call may be recorded.",
  "Ask for a visit and he offers real open times from the shop's calendar, then books the one you pick.",
  "Say there's an emergency and the shop gets an alert at once, while he walks you through shutting the water off.",
  "Ask something he doesn't know and he says the plumber will confirm. He doesn't guess.",
];

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-start gap-x-16 gap-y-10 px-5 pt-12 pb-24 md:grid-cols-2 md:pt-20">
          <div className="md:col-start-1">
            <p className="eyebrow">Live demo</p>
            <h1 className="mt-4 text-[2.4rem] leading-[1.05] font-extrabold sm:text-5xl">
              Hear Godfrey answer a call.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Call from your own phone and pretend something&apos;s wrong. He answers as Sunset
              Plumbing, a made-up shop, exactly the way he&apos;d answer for a real one. It
              takes about two minutes.
            </p>
          </div>
          {/* On a phone the form comes right after the headline; on wider screens it sits beside both. */}
          <div className="md:col-start-2 md:row-span-2 md:row-start-1">
            <DemoForm />
          </div>
          <div className="md:col-start-1">
            <p className="text-sm font-semibold">What happens on the call</p>
            <ul className="mt-4 flex flex-col gap-4">
              {WHAT_HAPPENS.map((line, i) => (
                <li key={line} className="flex gap-3.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft font-display text-sm font-bold text-accent">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
