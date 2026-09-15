-- lovable-cron-fallback-reviewed: 96 runs/day; emails the studio what clients approved, declined, commented and confirmed in creative sessions within 15 minutes, one email per run and none when nothing is new
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
    raise exception 'Could not read the existing digest job''s bearer; schedule soleia-creative-feedback-digest by hand.';
  end if;

  if exists (select 1 from cron.job where jobname = 'soleia-creative-feedback-digest') then
    perform cron.unschedule('soleia-creative-feedback-digest');
  end if;

  perform cron.schedule(
    'soleia-creative-feedback-digest',
    '*/15 * * * *',
    format(
      $job$
      SELECT net.http_post(
        url := 'https://rszawchsbpsmtrtvljta.supabase.co/functions/v1/creative-feedback-digest',
        headers := %L::jsonb,
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      ) AS request_id;
      $job$,
      json_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || bearer)::text
    )
  );
end
$sched$;
