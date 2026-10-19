import Link from "next/link";

import { Mark } from "@/components/brand";

export default function BillingSuccessPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Mark className="h-12 w-12" />
      <h1 className="mt-6 text-3xl font-bold">You&apos;re on Pro</h1>
      <p className="mt-3 text-muted">
        Unlimited drafts. If the dashboard still shows the free plan, give it a few seconds
        and reload.
      </p>
      <Link href="/dashboard" className="btn-primary mt-8">
        Back to the drafter
      </Link>
    </main>
  );
}
