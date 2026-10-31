// Who's asking for the demo number. Stored as the slug; the database check and the
// Discord ping (supabase/demo_requests.sql) use the same list.
export const ROLES = [
  { value: "shop_owner", label: "I run a trade shop" },
  { value: "shop_staff", label: "I work at one (office or dispatch)" },
  { value: "investor", label: "Investor" },
  { value: "recruiter", label: "Hiring or recruiting" },
  { value: "builder", label: "Builder or engineer" },
  { value: "curious", label: "Just curious" },
] as const;

export type Role = (typeof ROLES)[number]["value"];
export const ROLE_VALUES = ROLES.map((r) => r.value) as [Role, ...Role[]];
