"use client";

import { useState } from "react";
import type { MissedCall, Urgency } from "@/lib/types";

const URGENCY_LABEL: Record<Urgency, string> = {
  emergency: "Emergency",
  high: "Call back soon",
  normal: "Normal",
};

const URGENCY_STYLE: Record<Urgency, string> = {
  emergency: "border-missed/40 bg-missed/10 text-missed",
  high: "border-brass/40 bg-brass/10 text-brass",
  normal: "border-border text-muted",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-semibold transition hover:border-accent"
    >
      {copied ? "Copied" : "Copy text"}
    </button>
  );
}

export default function CallList({ calls }: { calls: MissedCall[] }) {
  if (calls.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
        <p className="font-semibold">No calls logged yet</p>
        <p className="mt-1 text-sm text-muted">
          Your drafts show up here. Hit &ldquo;Use an example&rdquo; above to see one in ten seconds.
        </p>
      </div>
    );
  }

  return (
    <section className="mt-10 flex flex-col gap-4">
      <h2 className="eyebrow">
        Recent calls
      </h2>

      {calls.map((call) => (
        <article key={call.id} className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold tabular-nums">{call.caller_number}</p>
            <div className="flex items-center gap-3">
              {call.drafts && (
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${URGENCY_STYLE[call.drafts.urgency]}`}
                >
                  {URGENCY_LABEL[call.drafts.urgency]}
                </span>
              )}
              <time className="text-xs text-muted">
                {new Date(call.created_at).toLocaleDateString()}
              </time>
            </div>
          </div>

          <p className="mt-2 text-sm text-muted">{call.drafts?.summary ?? call.context}</p>

          <div className="mt-4 flex flex-col gap-3">
            {call.drafts?.drafts.map((draft) => (
              <div key={draft.tone} className="rounded-xl bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                    {draft.tone}
                  </span>
                  <CopyButton text={draft.text} />
                </div>
                <p className="mt-2 text-sm leading-relaxed">{draft.text}</p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
