import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/brand";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center px-5 py-24">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-4xl font-extrabold">This page went to voicemail.</h1>
        <p className="mt-4 text-lg text-muted">It doesn&apos;t exist, or it moved.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary">
            Back home
          </Link>
          <Link href="/demo" className="btn-ghost">
            Hear Godfrey instead
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
