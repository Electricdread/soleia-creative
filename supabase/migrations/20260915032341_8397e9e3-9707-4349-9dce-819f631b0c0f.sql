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