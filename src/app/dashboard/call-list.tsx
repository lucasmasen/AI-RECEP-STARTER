"use client";

import { useState } from "react";
import type { MissedCall, Urgency } from "@/lib/types";

const URGENCY_LABEL: Record<Urgency, string> = {
  emergency: "Emergency",
  high: "Call back soon",
  normal: "Normal",
};

const URGENCY_STYLE: Record<Urgency, string> = {
  emergency: "border-red-500/40 text-red-600 dark:text-red-400",
  high: "border-amber-500/40 text-amber-600 dark:text-amber-400",
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
      className="shrink-0 text-xs text-muted transition hover:text-foreground"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function CallList({ calls }: { calls: MissedCall[] }) {
  if (calls.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-muted">
        Nothing logged yet. Your drafts will show up here.
      </p>
    );
  }

  return (
    <section className="mt-10 flex flex-col gap-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
        Recent calls
      </h2>

      {calls.map((call) => (
        <article key={call.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{call.caller_number}</p>
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
              <div key={draft.tone} className="rounded-lg bg-background p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs uppercase tracking-wide text-muted">
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
