import Link from "next/link";

/** A shutoff valve handle in a drop: the brand mark. */
export function Mark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 2.5C16 2.5 5 14.2 5 20.5a11 11 0 0 0 22 0C27 14.2 16 2.5 16 2.5Z" fill="var(--accent)" />
      <rect x="9" y="18.5" width="14" height="4" rx="2" fill="var(--background)" />
      <rect x="14" y="14" width="4" height="13" rx="2" fill="var(--background)" />
      <circle cx="16" cy="20.5" r="2.2" fill="var(--brass)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md" aria-label="Shutoff Call home">
      <Mark />
      <span className="font-display text-lg font-bold tracking-tight [font-stretch:88%]">
        Shutoff Call
      </span>
    </Link>
  );
}

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Wordmark />
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/#how" className="hidden rounded-md px-3 py-2 text-muted hover:text-foreground sm:block">
            How it works
          </Link>
          <Link href="/#drafter" className="hidden rounded-md px-3 py-2 text-muted hover:text-foreground md:block">
            Callback drafter
          </Link>
          <Link
            href={signedIn ? "/dashboard" : "/login"}
            className="rounded-md px-3 py-2 text-muted hover:text-foreground"
          >
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
          <Link href="/demo" className="btn-primary px-4 py-2 text-sm">
            Hear Clara
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Mark className="h-5 w-5" />
          <span>
            Shutoff Call. Built by{" "}
            <a className="underline-offset-4 hover:text-foreground hover:underline" href="https://github.com/lucasmasen">
              Lucas Masen
            </a>
            .
          </span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <a className="hover:text-foreground" href="https://github.com/lucasmasen/AI-RECEP-DEMO">
            Receptionist source
          </a>
          <a className="hover:text-foreground" href="https://github.com/lucasmasen/AI-RECEP-STARTER">
            This site&apos;s source
          </a>
        </div>
      </div>
    </footer>
  );
}
