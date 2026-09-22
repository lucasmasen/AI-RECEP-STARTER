-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
--
-- Two tables. `profiles` tracks each user's plan; `missed_calls` holds the calls
-- they log and the drafts Claude wrote back. Row Level Security is on for both,
-- and every policy keys on auth.uid(), so a user can only ever read or write
-- their own rows — including through the public anon key the browser holds.

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  business    text,
  plan        text not null default 'free' check (plan in ('free', 'pro')),
  created_at  timestamptz not null default now()
);

create table if not exists public.missed_calls (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  caller_number text not null,
  context       text not null,
  drafts        jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists missed_calls_user_created_idx
  on public.missed_calls (user_id, created_at desc);

alter table public.profiles     enable row level security;
alter table public.missed_calls enable row level security;

-- profiles: read and update your own row only. No insert policy — rows are
-- created by the trigger below, which runs as the definer, not as the user.
drop policy if exists "read own profile"   on public.profiles;
drop policy if exists "update own profile" on public.profiles;
create policy "read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- missed_calls: full CRUD, scoped to your own rows. with check on insert stops a
-- client from writing a row under someone else's user_id.
drop policy if exists "read own calls"   on public.missed_calls;
drop policy if exists "insert own calls" on public.missed_calls;
drop policy if exists "update own calls" on public.missed_calls;
drop policy if exists "delete own calls" on public.missed_calls;
create policy "read own calls"   on public.missed_calls for select using (auth.uid() = user_id);
create policy "insert own calls" on public.missed_calls for insert with check (auth.uid() = user_id);
create policy "update own calls" on public.missed_calls for update using (auth.uid() = user_id);
create policy "delete own calls" on public.missed_calls for delete using (auth.uid() = user_id);

-- Give every new signup a profile row automatically, so the app never has to
-- handle a logged-in user with no plan.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
