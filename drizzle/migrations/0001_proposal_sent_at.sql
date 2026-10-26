-- When a proposal went out, and the 72 hours the client has to sign it (owner, 2026-10-25: "record when a
-- proposal is sent, set its 72-hour sign-by date, and remind me (internal only) before and after it lapses").
--
-- Nothing recorded the moment a proposal was sent: status flipped to 'sent' and that was all, so no reminder
-- could know when the client's window closed, and signoff_due_on was never set by anything.
--
-- A trigger rather than app code, because a proposal becomes 'sent' two ways (Mark Sent on the Proposals
-- screen, and reset_proposal_signature when a signed proposal is reopened) and both should start the clock.
-- A reopened proposal gets a fresh 72 hours: the client has to sign again.
--
-- sent_at + 72 hours is the exact lapse. signoff_due_on holds its date on the Strip, for screens that show a
-- date. An update that sets signoff_due_on itself in the same statement keeps the date it was given.
--
-- The two reminder stamps belong to proposal-reminders, which emails the studio once in the last day before the
-- window closes and once when it has. Each send of the proposal clears them.

alter table public.proposals add column if not exists sent_at timestamptz;
alter table public.proposals add column if not exists reminder_due_sent_at timestamptz;
alter table public.proposals add column if not exists reminder_lapsed_sent_at timestamptz;

comment on column public.proposals.sent_at is
  'When the proposal last became status sent. The client has 72 hours from here to sign.';
comment on column public.proposals.reminder_due_sent_at is
  'When proposal-reminders told the studio the signing window closes within a day. Cleared on each send.';
comment on column public.proposals.reminder_lapsed_sent_at is
  'When proposal-reminders told the studio the signing window had closed unsigned. Cleared on each send.';

create or replace function public.proposals_stamp_sent()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if new.status = 'sent' and (tg_op = 'INSERT' or old.status is distinct from 'sent') then
    new.sent_at := now();
    if tg_op = 'INSERT' or new.signoff_due_on is not distinct from old.signoff_due_on then
      new.signoff_due_on := ((now() + interval '72 hours') at time zone 'America/Los_Angeles')::date;
    end if;
    new.reminder_due_sent_at := null;
    new.reminder_lapsed_sent_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists proposals_stamp_sent on public.proposals;
create trigger proposals_stamp_sent
  before insert or update on public.proposals
  for each row execute function public.proposals_stamp_sent();