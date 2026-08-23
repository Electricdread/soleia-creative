create table if not exists public.calendar_event_brief (
  id uuid primary key default gen_random_uuid(),
  event_uid text not null unique,
  group_name text,
  event_date_text text,
  event_time_text text,
  guest_count text,
  location text,
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

alter table public.calendar_event_meeting_links
  add column if not exists meeting_at timestamptz,
  add column if not exists duration_minutes integer;

create index if not exists calendar_event_meeting_links_meeting_at_idx
  on public.calendar_event_meeting_links (meeting_at)
  where meeting_at is not null;