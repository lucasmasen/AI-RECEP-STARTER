import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ROLE_VALUES } from "@/lib/demo";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const RequestSchema = z.object({
  name: z.string().trim().min(1, "Add your name.").max(80),
  email: z.string().trim().email("That email doesn't look right.").max(200),
  business: z.string().trim().max(120).optional().default(""),
  role: z.enum(ROLE_VALUES).optional(),
  source: z.string().max(200).optional().default(""),
  // Bots fill every field and submit instantly. People leave this one empty and take a few seconds.
  website: z.string().max(0).optional().default(""),
  startedAt: z.number().int().positive(),
});

const MIN_FILL_MS = 2500;

/**
 * Hands out the demo line's number to someone who says who they are. The number isn't in the
 * page; it lives in the database and comes back from request_demo_access(), which records the
 * request, rate-limits by network, and pings the owner (see supabase/demo_requests.sql).
 * Only a hash of the caller's IP is stored.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "The demo isn't set up on this deployment." }, { status: 503 });
  }

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0];
    const message = field?.path[0] === "website" || field?.path[0] === "startedAt"
      ? "Something went wrong. Please try again."
      : (field?.message ?? "Check the form and try again.");
    return NextResponse.json({ error: message, field: field?.path[0] }, { status: 400 });
  }
  const form = parsed.data;
  if (Date.now() - form.startedAt < MIN_FILL_MS) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = createHash("sha256").update(`shutoff-call:${ip}`).digest("hex");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_demo_access", {
    p_name: form.name,
    p_email: form.email,
    p_business: form.business,
    p_role: form.role ?? "",
    p_source: form.source,
    p_ip_hash: ipHash,
  });

  if (error) {
    if (error.message.includes("rate_limited")) {
      return NextResponse.json(
        { error: "Lots of requests from your network just now. Try again in an hour." },
        { status: 429 },
      );
    }
    if (error.code === "23514") {
      return NextResponse.json({ error: "Check your name and email and try again." }, { status: 400 });
    }
    console.error("request_demo_access failed", error.code, error.message);
    return NextResponse.json({ error: "Couldn't get the number just now. Try again in a minute." }, { status: 500 });
  }

  const number = data as { display: string | null; tel: string | null } | null;
  if (!number?.display || !number.tel) {
    return NextResponse.json({ error: "The demo line isn't available right now." }, { status: 503 });
  }
  return NextResponse.json({ display: number.display, tel: number.tel });
}
