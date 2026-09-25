import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getUsage } from "@/lib/plan";

const RequestSchema = z.object({
  caller_number: z.string().trim().min(3).max(40),
  context: z.string().trim().min(1).max(2000),
});

const DraftsSchema = z.object({
  urgency: z
    .enum(["emergency", "high", "normal"])
    .describe("How fast this caller needs a human. emergency = active damage or danger."),
  summary: z.string().describe("One short line: what this caller actually wants."),
  drafts: z
    .array(
      z.object({
        tone: z.enum(["direct", "warm", "apologetic"]),
        text: z.string().describe("The SMS itself. Under 320 characters."),
      }),
    )
    .length(3)
    .describe("Three send-ready callback texts, one per tone."),
});

const SYSTEM = `You write callback texts for a small trade business (plumbing, HVAC, locksmith,
restoration) whose owner just missed a call and is texting the caller back.

Write as the owner, not as an assistant. Rules:
- Plain SMS. No greeting block, no signature, no emoji, no marketing voice.
- Under 320 characters each.
- Never invent a price, an arrival time, a technician name, or an availability slot.
  If the caller needs one, ask instead of guessing.
- Always give the caller one concrete next step: a question to answer, or a time window
  to confirm.
- If the context describes active damage, gas, lockout in the cold, or anything unsafe,
  mark urgency "emergency" and make every draft lead with an immediate callback.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Give me the caller's number and a line about what they wanted." },
      { status: 400 },
    );
  }

  // Quota is checked server side, before the model call. The client also hides
  // the button at zero, but that's cosmetic — this is the check that counts.
  const usage = await getUsage(supabase, user.id);
  if (usage.remaining !== null && usage.remaining <= 0) {
    return NextResponse.json(
      { error: "You're out of free drafts this month.", upgrade: true },
      { status: 402 },
    );
  }

  const { caller_number, context } = parsed.data;

  let drafts;
  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.parse({
      model: "claude-opus-5",
      max_tokens: 4000,
      system: SYSTEM,
      // Thinking stays on — it's what keeps the model from wandering outside the
      // "never invent a price" rules — but effort drops to low. Writing three
      // 300-character texts doesn't need deep reasoning, and the default (high)
      // spends several cents a draft on thinking tokens nobody reads.
      thinking: { type: "adaptive" },
      output_config: { effort: "low", format: zodOutputFormat(DraftsSchema) },
      messages: [
        {
          role: "user",
          content: `Missed call from ${caller_number}.\nWhat they wanted: ${context}`,
        },
      ],
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "The model didn't return usable drafts. Try again." },
        { status: 502 },
      );
    }
    drafts = response.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is missing or invalid." }, { status: 500 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Rate limited. Try again in a moment." }, { status: 429 });
    }
    console.error("draft failed", error);
    return NextResponse.json({ error: "Couldn't write the drafts." }, { status: 502 });
  }

  const { data: row, error: insertError } = await supabase
    .from("missed_calls")
    .insert({ user_id: user.id, caller_number, context, drafts })
    .select()
    .single();

  if (insertError) {
    console.error("insert failed", insertError);
    return NextResponse.json({ error: "Drafted, but couldn't save it." }, { status: 500 });
  }

  return NextResponse.json({ call: row });
}
