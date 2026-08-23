-- The calendar event card is where a job starts, so two things it could not
-- hold before:
--
-- 1. The PM's brief. Every job begins with the same handful of facts — group,
--    date, time, headcount, room, the 21-business-day asset deadline — followed
--    by the notes that actually matter. It was being typed into email each
--    time; this gives it a home on the event it describes.
--
-- 2. When a meeting is. calendar_event_meeting_links held a URL and a label but
--    no time, so a pasted Zoom link could not appear on the calendar or warn
--    anyone that it starts in an hour.

create table if not exists public.calendar_event_brief (
  id uuid primary key default gen_random_uuid(),
  event_uid text not null unique,
  -- Group Name, kept as one string: the PM writes "NCAN *National College
  -- Attainment Network" and the aside is part of the answer.
  group_name text,
  -- Date, time and headcount are prefilled from the calendar event and the
  -- Triple Seat scrape, but stay editable text: the feed says 5:00 pm and the
  -- brief may need to say "5:00 pm - 8:00 pm (3pm pool closure)".
  event_date_text text,
  event_time_text text,
  guest_count text,
  location text,
  -- 21 business days before the event, US federal holidays skipped. Stored
  -- rather than derived so a negotiated date survives.
  deadline_on date,
  additional_notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_event_brief enable row level security;

drop policy if exists "Admins can manage event briefs" on public.calendar_event_brief;
create policy "Admins can manage event briefs"
  on public.calendar_event_brief
  for all
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create index if not exists calendar_event_brief_event_uid_idx
  on public.calendar_event_brief (event_uid);

-- A meeting link that knows when it is can be drawn on the calendar and can
-- warn the dashboard. Null means an untimed link, which is what every existing
-- row is, so nothing here changes what is already stored.
alter table public.calendar_event_meeting_links
  add column if not exists meeting_at timestamptz,
  add column if not exists duration_minutes integer;

create index if not exists calendar_event_meeting_links_meeting_at_idx
  on public.calendar_event_meeting_links (meeting_at)
  where meeting_at is not null;
