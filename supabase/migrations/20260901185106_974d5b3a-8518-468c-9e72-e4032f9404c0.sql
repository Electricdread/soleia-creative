alter table public.job_assignees
  add column if not exists notified_at timestamptz;

update public.job_assignees set notified_at = now() where notified_at is null;