"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { ROLES, type Role } from "@/lib/demo";

type DemoNumber = { display: string; tel: string };

const STORAGE_KEY = "shutoff-call:demo-number";

const TRY_SAYING = [
  { label: "An emergency", line: "“My pipe just burst under the kitchen sink!”" },
  { label: "Something routine", line: "“My bathroom sink is draining really slowly.”" },
  { label: "A curveball", line: "“How much do you charge?” or “Am I talking to a real person?”" },
];

function parseSaved(raw: string | null): DemoNumber | null {
  try {
    const saved = JSON.parse(raw ?? "null");
    return saved?.display && saved?.tel ? saved : null;
  } catch {
    return null;
  }
}

// The number from an earlier visit, read the way React wants external state read: null on the
// server and the first paint, the stored value right after, and updated if another tab saves one.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function sourceOf(): string {
  const params = new URLSearchParams(window.location.search);
  const tagged = params.get("utm_source") ?? params.get("ref");
  if (tagged) return tagged.slice(0, 200);
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : "";
    return host && host !== window.location.hostname ? host : "";
  } catch {
    return "";
  }
}

export default function DemoForm() {
  const savedRaw = useSyncExternalStore(subscribe, readStorage, () => null);
  const saved = useMemo(() => parseSaved(savedRaw), [savedRaw]);
  const [fresh, setFresh] = useState<DemoNumber | null>(null);
  const number = fresh ?? saved;
  const [role, setRole] = useState<Role | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const startedAt = useRef(0);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/demo-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          business: data.get("business") ?? "",
          role: role ?? undefined,
          website: data.get("website") ?? "",
          source: sourceOf(),
          startedAt: startedAt.current,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError({ message: body.error ?? "Something went wrong. Please try again.", field: body.field });
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(body));
      } catch {
        // Private mode: the reveal still works, it just won't survive a reload.
      }
      setFresh(body);
      requestAnimationFrame(() => {
        revealRef.current?.focus({ preventScroll: true });
        revealRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setError({ message: "Couldn't reach the server. Check your connection and try again." });
    } finally {
      setPending(false);
    }
  }

  async function copy() {
    if (!number) return;
    try {
      await navigator.clipboard.writeText(number.display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the number is on screen to type.
    }
  }

  if (number) {
    return (
      <div ref={revealRef} tabIndex={-1} className="card rise-in scroll-mt-24 p-7 outline-none sm:p-8" aria-live="polite">
        <p className="flex items-center gap-2 text-sm font-semibold text-ok">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8.5l3.2 3L13 4.5" />
          </svg>
          You&apos;re in. Call Clara:
        </p>
        <p className="mt-3 font-display text-[2.6rem] leading-none font-extrabold tracking-tight tabular-nums [font-stretch:90%] sm:text-5xl">
          {number.display}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={`tel:${number.tel}`} className="btn-primary flex-1 py-3.5 text-base">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
              <path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1Z" />
            </svg>
            Call now
          </a>
          <button type="button" onClick={copy} className="btn-ghost flex-1 py-3.5 text-base">
            {copied ? "Copied" : "Copy number"}
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">On a computer? Dial it from your phone.</p>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm font-semibold">Try saying</p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {TRY_SAYING.map((t) => (
              <li key={t.label} className="rounded-xl bg-background px-4 py-3">
                <span className="text-xs font-semibold tracking-wide text-muted uppercase">{t.label}</span>
                <p className="mt-0.5 leading-snug">{t.line}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-muted">
            Clara is an AI, and the call may be recorded. She answers as Demo Plumbing, a made-up
            shop, so nothing you say reaches a real plumber.
          </p>
        </div>
      </div>
    );
  }

  const fieldError = (name: string) => (error?.field === name ? error.message : null);

  return (
    <form onSubmit={onSubmit} className="card p-7 sm:p-8" noValidate={false}>
      <h2 className="text-2xl font-bold">Get the demo number</h2>
      <p className="mt-1.5 text-muted">So I know who&apos;s calling. Takes ten seconds.</p>

      <div className="mt-7 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Name</span>
          <input name="name" required maxLength={80} autoComplete="name" className="field" placeholder="Jordan Lee" aria-invalid={Boolean(fieldError("name"))} />
          {fieldError("name") && <span className="text-sm text-missed">{fieldError("name")}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Email</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" inputMode="email" className="field" placeholder="you@example.com" aria-invalid={Boolean(fieldError("email"))} />
          {fieldError("email") && <span className="text-sm text-missed">{fieldError("email")}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">
            Business <span className="font-normal text-muted">(optional)</span>
          </span>
          <input name="business" maxLength={120} autoComplete="organization" className="field" placeholder="Bayview Plumbing" />
        </label>

        <fieldset>
          <legend className="text-sm font-semibold">
            What brings you here? <span className="font-normal text-muted">(optional)</span>
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={role === r.value}
                onClick={() => setRole(role === r.value ? null : r.value)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                  role === r.value
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-border hover:border-accent"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Honeypot: hidden from people and screen readers, irresistible to form bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>

      {error && !error.field && (
        <p role="alert" className="mt-5 rounded-lg border border-missed/30 bg-missed/10 px-4 py-3 text-sm text-missed">
          {error.message}
        </p>
      )}

      <button disabled={pending} className="btn-primary mt-7 w-full py-3.5 text-base">
        {pending ? "One second…" : "Show me the number"}
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        I&apos;ll only use this to follow up about the demo. No newsletter.
      </p>
    </form>
  );
}
