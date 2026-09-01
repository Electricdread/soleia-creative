create table if not exists public.pm_intro_confirmations (
  token uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text,
  job_count integer not null default 0,
  sent_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.pm_intro_confirmations enable row level security;