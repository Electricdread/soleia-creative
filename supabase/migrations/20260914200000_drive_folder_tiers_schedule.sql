-- Client job folders coloured by how close the show is, and moved into Soleia Clients / Archive 7 days after
-- it (owner, 2026-09-14). Every morning at 13:00 UTC: 06:00 in Las Vegas in summer, 05:00 in winter.
-- organize-client-drive-folders is idempotent: a run that finds nothing to change writes nothing.
do $sched$
declare
  bearer text;
begin
  -- Reuse the header block the existing digest job already carries, as the calendar sync does, so this
  -- migration never has to restate a key.
  select substring(command from 'Bearer ([A-Za-z0-9._-]+)')
    into bearer
    from cron.job
   where jobname = 'soleia-deadline-digest'
   limit 1;

  if bearer is null then
    raise exception 'Could not read the existing digest job''s bearer; schedule soleia-drive-folder-tiers by hand.';
  end if;

  if exists (select 1 from cron.job where jobname = 'soleia-drive-folder-tiers') then
    perform cron.unschedule('soleia-drive-folder-tiers');
  end if;

  perform cron.schedule(
    'soleia-drive-folder-tiers',
    '0 13 * * *',
    format(
      $job$
      SELECT net.http_post(
        url := 'https://rszawchsbpsmtrtvljta.supabase.co/functions/v1/organize-client-drive-folders',
        headers := %L::jsonb,
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
      ) AS request_id;
      $job$,
      json_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || bearer)::text
    )
  );
end
$sched$;
