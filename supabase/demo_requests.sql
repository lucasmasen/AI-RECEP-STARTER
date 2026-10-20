-- The "Hear Godfrey" page: a visitor leaves a name and email, then gets the demo line's number.
--
-- The number isn't in the site's code. It lives in demo_line_settings and only comes back from
-- request_demo_access(), which checks the fields, rate-limits, and records the request. Each new
-- request pings the owner's Discord through a trigger (pg_net), so the site needs no extra keys.
--
-- This is a soft gate, not a secret: the goal is fewer stray calls and a lead for every real one.

create extension if not exists pg_net with schema extensions;

create table if not exists public.demo_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 80),
  email       text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  business    text check (char_length(business) <= 120),
  role        text check (role in ('shop_owner', 'shop_staff', 'investor', 'recruiter', 'builder', 'curious')),
  source      text check (char_length(source) <= 200),
  ip_hash     text check (char_length(ip_hash) <= 128)
);
create index if not exists demo_requests_email_created_idx on public.demo_requests (lower(email), created_at desc);
create index if not exists demo_requests_ip_created_idx on public.demo_requests (ip_hash, created_at desc);

-- Row level security on, no policies: nobody reads or writes this table directly through the API.
-- Requests come in only through request_demo_access() below.
alter table public.demo_requests enable row level security;

-- The number the page reveals, kept next to the demo line's other settings.
insert into public.demo_line_settings (key, value) values
  ('demo_phone_display', '(628) 201-0355'),
  ('demo_phone_tel', '+16282010355')
on conflict (key) do update set value = excluded.value;

-- Returns {"display": ..., "tel": ...}. The same email within a day gets the number again without a
-- new row (or a second Discord ping). More than 5 new requests an hour from one IP is refused.
create or replace function public.request_demo_access(
  p_name text, p_email text, p_business text, p_role text, p_source text, p_ip_hash text
) returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_recent int;
begin
  if not exists (
    select 1 from public.demo_requests
    where lower(email) = v_email and created_at > now() - interval '1 day'
  ) then
    select count(*) into v_recent from public.demo_requests
    where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';
    if v_recent >= 5 then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;

    insert into public.demo_requests (name, email, business, role, source, ip_hash)
    values (trim(p_name), v_email, nullif(trim(p_business), ''), nullif(p_role, ''),
            nullif(left(p_source, 200), ''), p_ip_hash);
  end if;

  return json_build_object(
    'display', (select value from public.demo_line_settings where key = 'demo_phone_display'),
    'tel',     (select value from public.demo_line_settings where key = 'demo_phone_tel')
  );
end;
$$;

-- Server only. The website's /api/demo-access calls this with the service-role key after its bot
-- checks; the public key every browser holds can't call it, so nobody can skip those checks or
-- invent IP hashes to dodge the rate limit.
revoke all on function public.request_demo_access(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.request_demo_access(text, text, text, text, text, text) to service_role;

-- A Discord ping per new request, at most 20 an hour: the 21st sends one "possible spam" warning
-- and the rest stay quiet until the hour rolls over (rows are still saved). allowed_mentions stops
-- anyone typing @everyone into the form.
create or replace function public.notify_demo_request() returns trigger
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  v_url text;
  v_last_hour int;
  v_content text;
  v_role text := case new.role
    when 'shop_owner' then 'Runs a trade shop'
    when 'shop_staff' then 'Works at a shop (office or dispatch)'
    when 'investor' then 'Investor'
    when 'recruiter' then 'Hiring or recruiting'
    when 'builder' then 'Builder or engineer'
    when 'curious' then 'Just curious'
    else 'Not given' end;
begin
  select count(*) into v_last_hour from public.demo_requests where created_at > now() - interval '1 hour';
  if v_last_hour > 21 then
    return new;
  end if;
  select value into v_url from public.demo_line_settings where key = 'discord_webhook_url';
  if v_url is null then
    return new;
  end if;
  if v_last_hour = 21 then
    v_content := E'**\u26A0\uFE0F Demo form: more than 20 requests in the last hour.** '
                 'Possible spam. Pings are paused for the rest of the hour; every request is still saved in demo_requests.';
  else
    v_content := left(
      E'**\U0001F3AF New demo request**\n' ||
      'Name: ' || new.name || E'\n' ||
      'Email: ' || new.email || E'\n' ||
      'Business: ' || coalesce(new.business, 'not given') || E'\n' ||
      'Who: ' || v_role ||
      coalesce(E'\nFrom: ' || new.source, ''), 2000);
  end if;
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('content', v_content, 'allowed_mentions', jsonb_build_object('parse', '[]'::jsonb)),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
end;
$$;

-- Trigger functions never need to be callable through the API.
revoke execute on function public.notify_demo_request() from public, anon, authenticated;

drop trigger if exists demo_requests_notify on public.demo_requests;
create trigger demo_requests_notify after insert on public.demo_requests
  for each row execute function public.notify_demo_request();
