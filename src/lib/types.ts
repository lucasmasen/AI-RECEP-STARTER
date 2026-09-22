export type Urgency = "emergency" | "high" | "normal";
export type Tone = "direct" | "warm" | "apologetic";

export type Drafts = {
  urgency: Urgency;
  summary: string;
  drafts: { tone: Tone; text: string }[];
};

export type MissedCall = {
  id: string;
  caller_number: string;
  context: string;
  drafts: Drafts | null;
  created_at: string;
};
