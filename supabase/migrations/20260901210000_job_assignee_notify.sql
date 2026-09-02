-- A new assignee is emailed once that they are on the job (notify-job-assigned).
-- Rows that existed before this feature are stamped as already notified, so
-- turning it on cannot surprise-email a months-old assignment.
alter table public.job_assignees
  add column if not exists notified_at timestamptz;

update public.job_assignees set notified_at = now() where notified_at is null;
