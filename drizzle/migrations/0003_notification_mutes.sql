-- Who has asked not to receive a particular studio email (owner, 2026-10-27: "remove rivka from notifications of
-- files landing and daily and weekly reports").
--
-- A person gets copies because of what they are on (job_assignees) or who they are (report_subscriptions), and
-- both of those should stay true: Rivka is still on her jobs and is still the VP. This records the one thing that
-- changed, which emails reach her. One row per person per template, using the template names email_send_log
-- already carries. The senders that read it today: drive-upload-watcher (client-files-received, finals-received),
-- send-deadline-digest (deadline-digest) and weekly-report (weekly-report-executive, weekly-report-pm). A template
-- no sender reads yet is muted for nobody.
--
-- Service-role only, like the other tables the mailers own: RLS on, no policies. Unmute with a delete.
create table if not exists public.notification_mutes (
  email text not null,
  template text not null,
  created_at timestamptz not null default now(),
  primary key (email, template),
  check (email = lower(btrim(email)))
);

alter table public.notification_mutes enable row level security;

insert into public.notification_mutes (email, template) values
  ('rivka@soleialv.com', 'client-files-received'),
  ('rivka@soleialv.com', 'finals-received'),
  ('rivka@soleialv.com', 'deadline-digest'),
  ('rivka@soleialv.com', 'weekly-report-executive'),
  ('rivka@soleialv.com', 'weekly-report-pm')
on conflict (email, template) do nothing;