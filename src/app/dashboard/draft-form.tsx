"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const EXAMPLE = {
  caller_number: "(415) 555-0142",
  context: "Voicemail: water heater is leaking into the garage, she wants someone out today and asked what it costs.",
};

export default function DraftForm({ outOfDrafts }: { outOfDrafts: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function fillExample() {
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem("caller_number") as HTMLInputElement).value = EXAMPLE.caller_number;
    (form.elements.namedItem("context") as HTMLTextAreaElement).value = EXAMPLE.context;
  }

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
    <form ref={formRef} onSubmit={onSubmit} className="card mt-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Log a missed call</h2>
        <button type="button" onClick={fillExample} className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
          Use an example
        </button>
      </div>

      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Caller number</span>
        <input
          name="caller_number"
          required
          inputMode="tel"
          placeholder="(415) 555-0142"
          className="field"
        />
      </label>

      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-sm font-semibold">What they wanted</span>
        <textarea
          name="context"
          required
          rows={3}
          placeholder="Voicemail said water heater is leaking into the garage, wants someone today"
          className="field resize-y"
        />
        <span className="text-xs text-muted">
          A voicemail transcript, a note to yourself, whatever you actually have.
        </span>
      </label>

      <button
        disabled={pending || outOfDrafts}
        className="btn-primary mt-6 w-full"
      >
        {outOfDrafts
          ? "Out of free drafts this month"
          : pending
            ? "Writing three drafts…"
            : "Write callback texts"}
      </button>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-missed/30 bg-missed/10 px-4 py-3 text-sm text-missed">
          {error}
        </p>
      )}
    </form>
  );
}
