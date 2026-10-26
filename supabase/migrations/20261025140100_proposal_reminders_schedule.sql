-- proposal-reminders, every hour at :05. It emails the studio when a sent proposal's 72-hour signing window
-- closes within a day, and again when it has closed unsigned — once each per send (the stamps on proposals
-- say which have gone). Most runs send nothing. Apply after the function is deployed.
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
    raise exception 'Could not read the existing digest job''s bearer; schedule soleia-proposal-reminders by hand.';
  end if;

  if exists (select 1 from cron.job where jobname = 'soleia-proposal-reminders') then
    perform cron.unschedule('soleia-proposal-reminders');
  end if;

  perform cron.schedule(
    'soleia-proposal-reminders',
    '5 * * * *',
    format(
      $job$
      SELECT net.http_post(
        url := 'https://rszawchsbpsmtrtvljta.supabase.co/functions/v1/proposal-reminders',
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
