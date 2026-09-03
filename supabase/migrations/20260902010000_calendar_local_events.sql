-- The calendar has only ever mirrored the Triple Seat feed, so anything not
-- booked through Triple Seat — an internal hold, a site visit, a load-in day,
-- a show that came in another way — could not be put on it at all.
--
-- These are events the studio raises itself. They live beside the feed rather
-- than in it: the feed stays the system of record for what Triple Seat knows,
-- and nothing here can be overwritten by the next sync.
--
-- dtstart and dtend are text in the feed's own naive shape
-- ('YYYY-MM-DDTHH:MM:SS', no zone) because every reader parses both kinds the
-- same way; storing one of them as timestamptz would silently shift a local
-- event against the feed events sitting next to it in the same list.
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

-- The same rule the rest of the calendar's own tables carry.
drop policy if exists "Admins can manage local events" on public.calendar_local_events;
create policy "Admins can manage local events"
  on public.calendar_local_events
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

grant select, insert, update, delete on public.calendar_local_events to authenticated;
grant select on public.calendar_local_events to anon;

-- A local event is found by date the way the feed's are.
create index if not exists calendar_local_events_dtstart_idx
  on public.calendar_local_events (dtstart);
