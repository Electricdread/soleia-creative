-- Who is on the call.
--
-- A meeting card that shows the time and the join link but not who is expected
-- is half a card: the first question anyone asks about a call they are about to
-- join is who else is on it. Invites carry the answer — Teams lists required
-- attendees, Zoom and Google put the addresses in the body — so it is read out
-- of the paste alongside the link and the time, and stays editable.
alter table public.calendar_event_meeting_links
  add column if not exists attendees text[];
