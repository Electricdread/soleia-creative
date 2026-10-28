-- Only the scheduler or a signed-in admin can run the Monday report (owner, 2026-10-27: "close the weekly report's
-- open test mode so only signed-in admins or the scheduler can get the report").
--
-- weekly-report is declared verify_jwt = false, and the bearer its cron job sends is the anon key, which ships in
-- the public bundle. So anyone could POST {"dry_run": true} and read every live job and client, or POST {} and
-- send the report to everybody. A valid JWT proves nothing here: the anon key is one.
--
-- The scheduler now proves itself with a secret only the database holds. It is generated here, kept in Vault
-- (`soleia_cron_secret`), read by the cron job when it runs and sent as the `x-soleia-cron` header. The function
-- asks check_cron_secret() whether the header matches, so the secret never leaves the database except on the
-- scheduler's own call. Nobody needs to know its value. Rotate it with vault.update_secret; nothing else changes.
--
-- Named for the studio rather than this one report, so the other mailers the scheduler calls can adopt it.

do $vault$
begin
  if not exists (select 1 from vault.secrets where name = 'soleia_cron_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'soleia_cron_secret',
      'Sent by pg_cron as x-soleia-cron so edge functions can tell the scheduler from the public.'
    );
  end if;
end
$vault$;

create or replace function public.check_cron_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(
    p_secret is not null and length(p_secret) > 0 and p_secret = (
      select decrypted_secret from vault.decrypted_secrets where name = 'soleia_cron_secret' limit 1
    ),
    false
  );
$$;

revoke all on function public.check_cron_secret(text) from public, anon, authenticated;
grant execute on function public.check_cron_secret(text) to service_role;

-- Same schedule, URL, body and timeout as 20260901234500_weekly_report.sql; the header block now reads the secret
-- at run time instead of carrying anything that would show in cron.job.
do $sched$
declare
  bearer text;
begin
  select substring(command from 'Bearer ([A-Za-z0-9._-]+)')
    into bearer
    from cron.job
   where jobname = 'soleia-deadline-digest'
   limit 1;

  if bearer is null then
    raise exception 'Could not read the existing digest job''s bearer; reschedule soleia-weekly-report by hand.';
  end if;

  if exists (select 1 from cron.job where jobname = 'soleia-weekly-report') then
    perform cron.unschedule('soleia-weekly-report');
  end if;

  perform cron.schedule(
    'soleia-weekly-report',
    '0 14 * * 1',
    format(
      $job$
      SELECT net.http_post(
        url := 'https://rszawchsbpsmtrtvljta.supabase.co/functions/v1/weekly-report',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', %L,
          'x-soleia-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'soleia_cron_secret' limit 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 90000
      ) AS request_id;
      $job$,
      'Bearer ' || bearer
    )
  );
end
$sched$;
