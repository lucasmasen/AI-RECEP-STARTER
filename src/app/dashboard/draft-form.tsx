"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DraftForm({ outOfDrafts }: { outOfDrafts: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caller_number: data.get("caller_number"),
          context: data.get("context"),
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Couldn't write the drafts.");

      form.reset();
      // The new row and the updated quota both live in the server component.
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="font-medium">Log a missed call</h2>

      <label className="mt-4 flex flex-col gap-1.5 text-sm">
        Caller number
        <input
          name="caller_number"
          required
          placeholder="(415) 555-0142"
          className="rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>

      <label className="mt-4 flex flex-col gap-1.5 text-sm">
        What they wanted
        <textarea
          name="context"
          required
          rows={3}
          placeholder="Voicemail said water heater is leaking into the garage, wants someone today"
          className="resize-y rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:border-accent"
        />
        <span className="text-xs text-muted">
          A voicemail transcript, a note to yourself — whatever you actually have.
        </span>
      </label>

      <button
        disabled={pending || outOfDrafts}
        className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {outOfDrafts
          ? "Out of free drafts this month"
          : pending
            ? "Writing…"
            : "Write callback texts"}
      </button>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </form>
  );
}
