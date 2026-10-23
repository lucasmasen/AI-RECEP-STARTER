/**
 * The hero's example call: a missed-call notification, the start of the conversation, and
 * the alert the owner gets. Lines play in one after another (no motion if reduced motion is on).
 */
const LINES: { who: "clara" | "caller"; text: string }[] = [
  {
    who: "clara",
    text: "Good evening, Sunset Plumbing, this is Godfrey, the AI assistant here. Just so you know, this call is recorded. What can I help you with?",
  },
  { who: "caller", text: "There's water pouring out under my kitchen sink!" },
  {
    who: "clara",
    text: "Okay, let's stop the water first. Find your main shut-off, usually near the water heater, and turn it clockwise until it stops.",
  },
];

export default function CallCard() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-accent-soft/70 blur-2xl"
        aria-hidden="true"
      />
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <span className="ring grid h-9 w-9 place-items-center rounded-full bg-missed/12 text-missed">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
              <path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1Z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Missed call</p>
            <p className="text-xs text-muted">9:14 PM · you were on a job</p>
          </div>
          <span className="ml-auto rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
            Godfrey answered
          </span>
        </div>

        <div className="flex flex-col gap-3 px-5 py-5">
          {LINES.map((line, i) => (
            <div
              key={i}
              className={`rise-in max-w-[88%] rounded-2xl px-4 py-2.5 text-[0.95rem] leading-snug ${
                line.who === "clara"
                  ? "self-start rounded-bl-md bg-accent-soft text-foreground"
                  : "self-end rounded-br-md bg-foreground text-background"
              }`}
              style={{ animationDelay: `${0.35 + i * 0.9}s` }}
            >
              {line.text}
            </div>
          ))}
        </div>

        <div
          className="rise-in mx-4 mb-4 rounded-xl border border-brass/40 bg-brass/10 px-4 py-3"
          style={{ animationDelay: "3.2s" }}
        >
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-brass uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-brass" /> Sent to you, mid-call
          </p>
          <p className="mt-1.5 text-sm leading-snug">
            Burst pipe under kitchen sink. Name, callback number and cross street. Main is
            being shut off.
          </p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted">An example call on the demo line</p>
    </div>
  );
}
