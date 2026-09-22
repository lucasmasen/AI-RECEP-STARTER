# Missed Call Copilot

A small business misses a call, logs the number and what the caller wanted, and gets three
send-ready callback texts written by Claude — with an urgency read on the call and no
invented prices, arrival times, or availability.

<!-- Add the Vercel URL here once deployed: **Live:** https://… -->

![The landing page](docs/landing.png)

## Why this exists

I sell AI voice agents to small trade businesses — plumbing, HVAC, locksmith, restoration.
The single thing every one of them says out loud is that a missed call is a lost job,
because the caller dials the next result within a few minutes. Most of them already know
they should text back. What stops them is sitting down to write it while they're under a
sink.

So this is the smallest useful version of the thing they actually asked for: the writing
part, without the phone system.

## What's in it

| Piece | Where |
|---|---|
| Email + password auth, session refresh, protected routes | `src/lib/supabase/`, `src/proxy.ts` |
| Postgres tables with row level security | `supabase/schema.sql` |
| The Claude call — structured output, typed with Zod | `src/app/api/draft/route.ts` |
| Stripe subscription checkout | `src/app/api/checkout/route.ts` |
| Stripe webhook, signature-verified, flips the plan | `src/app/api/stripe/webhook/route.ts` |
| Dashboard, quota meter, copy-to-clipboard drafts | `src/app/dashboard/` |

Free plan is 5 drafts a month; Pro is unlimited.

## Decisions worth explaining

**The model isn't allowed to make things up.** The system prompt forbids inventing a price,
an arrival time, a technician name, or an availability slot, and requires every draft to end
in a concrete next step. A callback text that promises "someone will be there by 3" when
nobody will is worse for the business than no text at all — it converts a missed call into
an angry customer.

**The response is a typed schema, not prose.** `messages.parse()` with a Zod schema
(`output_config.format`) returns an urgency level, a one-line summary, and exactly three
drafts in fixed tones. Parsing free text for "the three drafts" would break the first time
the model formatted a list differently; this can't drift, and `parsed_output` is typed all
the way into the React component.

**Quota is enforced on the server, before the model call.** The client hides the button at
zero, but that's cosmetic — `/api/draft` re-reads usage from the database and returns 402
regardless of what the browser believes. Anything else means a free account can spend my
API budget with a `fetch` in the console.

**Row level security is the real access control, not the app code.** Every policy in
`schema.sql` keys on `auth.uid()`, so even the anon key the browser holds can't read another
user's calls. The app's own checks are a second layer, not the boundary.

**One route uses the service-role key, and only one.** The Stripe webhook writes a plan
change for a user who isn't the one making the request, so it has to bypass RLS. That's safe
specifically because `constructEventAsync` verifies the Stripe signature first — an unsigned
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

1. **A Supabase project.** Run `supabase/schema.sql` in the SQL editor, then copy the URL,
   anon key, and service-role key from Project Settings → API. For a demo account, turn off
   Authentication → Sign In / Providers → **Confirm email**, so sign-up logs you straight in.
2. **An Anthropic API key** from console.anthropic.com.
3. **Stripe test keys** and a recurring price id. Test mode only — card `4242 4242 4242 4242`.
4. **A webhook secret.** Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
   Deployed: add the endpoint in the Stripe dashboard and copy its signing secret.

Without Stripe the app runs fine — upgrading just returns "Stripe isn't configured."

## Deploying

Vercel, with the same environment variables. The Stripe webhook endpoint points at
`https://<your-domain>/api/stripe/webhook`. `SUPABASE_SERVICE_ROLE_KEY` must not be prefixed
`NEXT_PUBLIC_` anywhere — it bypasses RLS.

## Stack

Next.js 16 (App Router, Server Components) · TypeScript · Tailwind v4 · Supabase (Postgres,
Auth, RLS) · Claude via `@anthropic-ai/sdk` · Zod · Stripe

## Status

Built and running. Typecheck and production build pass; auth gating is verified end to end
(unauthenticated `/dashboard` redirects to `/login`, unauthenticated `POST /api/draft`
returns 401). The Claude, Supabase, and Stripe paths are written against current SDK docs
but need real credentials to exercise, so treat them as untested against live services until
the deploy above is done.
