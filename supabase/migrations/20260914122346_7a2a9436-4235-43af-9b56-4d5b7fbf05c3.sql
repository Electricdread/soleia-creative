-- lovable-cron-fallback-reviewed: 96 runs/day; syncs definite Soleia bookings to Google Calendar within 15 minutes of a status change, matching the verified edge function's required cadence
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