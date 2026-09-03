create table if not exists public.calendar_local_events (
  uid text primary key default ('local:' || gen_random_uuid()::text),
  summary text not null,
  description text,
  location text,
  dtstart text not null,
  dtend text,
  status text not null default 'CONFIRMED',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_local_events enable row level security;

drop policy if exists "Admins can manage local events" on public.calendar_local_events;
create policy "Admins can manage local events"
  on public.calendar_local_events
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

grant select, insert, update, delete on public.calendar_local_events to authenticated;
grant select on public.calendar_local_events to anon;

create index if not exists calendar_local_events_dtstart_idx
  on public.calendar_local_events (dtstart);