alter table public.calendar_event_meeting_links
  add column if not exists attendees text[];