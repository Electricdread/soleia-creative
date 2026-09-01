-- One row per intro email sent to an assigned PM. The Confirm button in that
-- email hits pm-intro's GET route with the row's token, which stamps
-- confirmed_at — so "did they get it" has an answer in data, not in asking.
-- Service-role access only: RLS is enabled with no policies on purpose.
create table if not exists public.pm_intro_confirmations (
  token uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text,
  job_count integer not null default 0,
  sent_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.pm_intro_confirmations enable row level security;
