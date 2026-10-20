# Shutoff Call

The website for Shutoff Call, an AI receptionist for plumbers and other trade shops. It has
two jobs:

- **Show the receptionist.** The landing page tells the story, and `/demo` hands a visitor the
  number of the live demo line once they say who they are. Godfrey answers as a made-up shop,
  "Demo Plumbing", so anyone can hear him handle a burst pipe from their own phone.
- **The callback drafter**, a free tool for the calls that already got missed: log the number
  and what the caller wanted, and Claude writes three send-ready callback texts with an urgency
  read and no invented prices, arrival times, or availability.

**Live:** https://ai-recep-starter.vercel.app

![The landing page](docs/landing.png)

The receptionist itself (the voice agent, the webhook that alerts the shop, per-shop routing)
lives in [AI-RECEP-DEMO](https://github.com/lucasmasen/AI-RECEP-DEMO).

## The demo number is behind a short form

Putting a live AI phone number on a public page invites every bot and bored visitor to call it,
and each call costs money and pings the owner. So `/demo` asks for a name and an email first,
and the number never ships in the page:

- `POST /api/demo-access` validates the form, drops bots with a hidden honeypot field and a
  "submitted too fast" check, and stores only a SHA-256 hash of the visitor's IP.
- It calls `request_demo_access()`, a Postgres function (`supabase/demo_requests.sql`) that
  records the request, refuses more than 5 new requests an hour from one network, and returns
  the number from a settings table. The same email within a day gets the number back without
  a second row.
- An insert trigger posts each new request to the owner's Discord through `pg_net`, so every
  person who tries the demo shows up as a lead within seconds. `allowed_mentions` is empty so
  nobody can type `@everyone` into the form and ping a whole server.
- The table has row level security on and no policies: nothing reads it through the public API.

It's a soft gate, not a secret. The point is fewer stray calls and a name behind every real one.

## What the callback drafter produces

Real output from the live app, not a mockup. Input was a voicemail note:
*"pipe burst under the kitchen sink, water all over the floor, she shut the main off.
Asking how soon someone can come out and what it'll cost."*

It tagged the call **Emergency**, summarized it as *"Burst pipe under kitchen sink flooded
the floor; main is shut off, she wants an ETA and cost,"* and wrote three drafts. The direct one:

> Got your voicemail about the burst pipe under the kitchen sink. Call me back now and I'll
> get you scheduled. Good call shutting the main off - leave it off. Can you tell me if the
> water is still spreading and whether it has reached any walls or cabinets? I'll quote once
> I see the pipe.

The caller asked what it would cost. All three drafts decline to guess (*"I'll quote once I
see the pipe"*), and none promise an arrival time. That's the constraint from the system
prompt holding under a request specifically designed to pull a number out of it.

## Why the drafter exists

I sell AI voice agents to small trade businesses: plumbing, HVAC, locksmith, restoration.
The single thing every one of them says out loud is that a missed call is a lost job,
because the caller dials the next result within a few minutes. Most of them already know
they should text back. What stops them is sitting down to write it while they're under a
sink.

The drafter was the smallest useful version of that: the writing part, without the phone
system. The phone system came next, in [AI-RECEP-DEMO](https://github.com/lucasmasen/AI-RECEP-DEMO):
a live receptionist that answers the call itself, walks a homeowner through shutting off a
burst pipe, alerts the owner mid-call, and never tells a caller help is coming unless the
alert actually went through.

## What's in it

| Piece | Where |
|---|---|
| Email + password auth, session refresh, protected routes | `src/lib/supabase/`, `src/proxy.ts` |
| Postgres tables with row level security | `supabase/schema.sql` |
| The Claude call: structured output, typed with Zod | `src/app/api/draft/route.ts` |
| Stripe subscription checkout | `src/app/api/checkout/route.ts` |
| Stripe webhook, signature-verified, flips the plan | `src/app/api/stripe/webhook/route.ts` |
| Dashboard, quota meter, copy-to-clipboard drafts | `src/app/dashboard/` |
| Landing page and brand (one palette, light and dark) | `src/app/page.tsx`, `src/components/` |
| The gated demo page and its API | `src/app/demo/`, `src/app/api/demo-access/route.ts` |
| Demo requests table, rate limit and Discord trigger | `supabase/demo_requests.sql` |

Free plan is 5 drafts a month; Pro is unlimited.

## Decisions worth explaining

**The model isn't allowed to make things up.** The system prompt forbids inventing a price,
an arrival time, a technician name, or an availability slot, and requires every draft to end
in a concrete next step. A callback text that promises "someone will be there by 3" when
nobody will is worse for the business than no text at all. It turns a missed call into an
angry customer.

**The response is a typed schema, not prose.** `messages.parse()` with a Zod schema
(`output_config.format`) returns an urgency level, a one-line summary, and exactly three
drafts in fixed tones. Parsing free text for "the three drafts" would break the first time
the model formatted a list differently; this can't drift, and `parsed_output` is typed all
the way into the React component.

**Quota is enforced on the server, before the model call.** The client hides the button at
zero, but that's cosmetic. `/api/draft` re-reads usage from the database and returns 402
regardless of what the browser believes. Anything else means a free account can spend my
API budget with a `fetch` in the console.

**Row level security is the real access control, not the app code.** Every policy in
`schema.sql` keys on `auth.uid()`, so even the anon key the browser holds can't read another
user's calls. The app's own checks are a second layer, not the boundary.

**One route uses the service-role key, and only one.** The Stripe webhook writes a plan
change for a user who isn't the one making the request, so it has to bypass RLS. That's safe
specifically because `constructEventAsync` verifies the Stripe signature first, so an unsigned
or replayed body is rejected before any database call. The webhook path is also excluded
from the proxy matcher, since it carries no session cookie and its raw body has to arrive
byte for byte.

**Sessions refresh in `proxy.ts`, but it doesn't do the authorizing.** Next 16 renamed
Middleware to Proxy; this one exists to rotate the Supabase cookie so users aren't silently
logged out. Every page and route still checks the session itself. Making the proxy the
gatekeeper would put the whole app behind one matcher regex.

## Running it locally

```bash
npm install
cp .env.example .env.local     # fill in the values below
npm run dev
```

You need four things:

1. **A Supabase project.** Run `supabase/schema.sql` in the SQL editor (and
   `supabase/demo_requests.sql` for the demo page, which expects the `demo_line_settings` table
   from AI-RECEP-DEMO), then copy the URL,
   anon key, and service-role key from Project Settings → API. For a demo account, turn off
   Authentication → Sign In / Providers → **Confirm email**, so sign-up logs you straight in.
2. **An Anthropic API key** from console.anthropic.com.
3. **Stripe test keys** and a recurring price id. Test mode only, with card `4242 4242 4242 4242`.
4. **A webhook secret.** Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
   Deployed: add the endpoint in the Stripe dashboard and copy its signing secret.

Without Stripe the app runs fine, and the dashboard simply doesn't show the upgrade button.

## Deploying

Vercel, with the same environment variables. The Stripe webhook endpoint points at
`https://<your-domain>/api/stripe/webhook`. `SUPABASE_SERVICE_ROLE_KEY` must not be prefixed
`NEXT_PUBLIC_` anywhere, because it bypasses RLS.

## Stack

Next.js 16 (App Router, Server Components) · TypeScript · Tailwind v4 · Supabase (Postgres,
Auth, RLS) · Claude via `@anthropic-ai/sdk` · Zod · Stripe

## Status

Deployed and verified end to end against live services: sign-up creates the account and its
profile row, the quota decrements, Claude returns structured drafts, and the row persists and
renders. Auth gating is verified too: unauthenticated `/dashboard` redirects to `/login`, and
unauthenticated `POST /api/draft` returns 401.

The demo page is verified the same way: a submission returns the number, writes one row,
and the Discord ping lands (HTTP 204); a repeat from the same email adds no row; a bad email
is refused; and the sixth new request in an hour from one network gets a 429.

Stripe is wired but not exercised; checkout needs test keys set, and until then the upgrade
button stays hidden.

`GET /api/health` reports the serving commit and whether each integration resolves (booleans
only, no values). It exists because diagnosing this deployment through a CDN was otherwise
guesswork: a cached page from an older build is indistinguishable from a new build that can't
see its credentials.

### A deployment note worth keeping

Vercel withholds **Sensitive** environment variables during the build, and Next.js inlines
`process.env.NEXT_PUBLIC_*` at build time. A `NEXT_PUBLIC_` variable marked Sensitive
therefore compiles to `undefined` permanently, even though the value exists at runtime. Vercel
refuses to save that combination at all. Since nothing here needs the value in the
browser, `src/lib/supabase/config.ts` resolves config at runtime through a variable index the
bundler can't inline, and accepts either naming convention. The variables in production are
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`, with no public prefix.
