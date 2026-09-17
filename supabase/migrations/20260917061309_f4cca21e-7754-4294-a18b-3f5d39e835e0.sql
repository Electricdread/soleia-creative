create table if not exists public.admin_login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists admin_login_events_created_at_idx
  on public.admin_login_events (created_at desc);

alter table public.admin_login_events enable row level security;
grant select on public.admin_login_events to authenticated;
grant all on public.admin_login_events to service_role;

drop policy if exists "Owner can view login events" on public.admin_login_events;
create policy "Owner can view login events"
  on public.admin_login_events
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'luisdreams@me.com');