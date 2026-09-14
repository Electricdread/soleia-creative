-- Soleia's confirmed bookings into the studio's Google Calendar, every 15 minutes (owner,
-- 2026-09-14: "soleia booked events - gets added to google account"). sync-google-calendar
-- is idempotent: a run that finds nothing changed writes nothing.
do $sched$
declare
  bearer text;
begin
  -- Reuse the header block the existing digest job already carries, as the weekly report
  -- does, so this migration never has to restate a key.
  select substring(command from 'Bearer ([A-Za-z0-9._-]+)')
    into bearer
    from cron.job
   where jobname = 'soleia-deadline-digest'
   limit 1;

  if bearer is null then
    raise exception 'Could not read the existing digest job''s bearer; schedule soleia-google-calendar-sync by hand.';
  end if;

  if exists (select 1 from cron.job where jobname = 'soleia-google-calendar-sync') then
    perform cron.unschedule('soleia-google-calendar-sync');
  end if;

  perform cron.schedule(
    'soleia-google-calendar-sync',
    '*/15 * * * *',
    format(
      $job$
      SELECT net.http_post(
        url := 'https://rszawchsbpsmtrtvljta.supabase.co/functions/v1/sync-google-calendar',
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
