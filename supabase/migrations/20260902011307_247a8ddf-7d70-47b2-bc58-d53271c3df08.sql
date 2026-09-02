-- The Monday report has two audiences, and only one of them can be derived
-- from the data: a PM is whoever is on a job. An executive is a decision, so
-- it is recorded rather than inferred.
--
-- Service-role only, like the other tables the mailers own: RLS on, no
-- policies. Add or remove an executive with a plain insert or delete here.
create table if not exists public.report_subscriptions (
  email text primary key,
  display_name text,
  scope text not null default 'executive' check (scope in ('executive')),
  created_at timestamptz not null default now()
);

alter table public.report_subscriptions enable row level security;

-- Rivka is VP: she reads the whole board, not the one job she is assigned to.
insert into public.report_subscriptions (email, display_name, scope)
values ('rivka@soleialv.com', 'Rivka', 'executive')
on conflict (email) do nothing;

-- Monday at 14:00 UTC — 9am Eastern, the hour the daily deadline digest
-- already lands, so the week opens on a familiar clock. The request carries
-- the same anon bearer the deadline digest's job uses; the timeout is set
-- because pg_net's 5s default cancelled the Drive watcher for weeks.
do $do$
begin
  if exists (select 1 from cron.job where jobname = 'soleia-weekly-report') then
    perform cron.unschedule('soleia-weekly-report');
  end if;
end
$do$;

do $sched$
declare
  bearer text;
begin
  -- Reuse the header block the existing digest job already carries, so this
  -- migration never has to restate a key.
  select substring(command from 'Bearer ([A-Za-z0-9._-]+)')
    into bearer
    from cron.job
   where jobname = 'soleia-deadline-digest'
   limit 1;

  if bearer is null then
    raise exception 'Could not read the existing digest job''s bearer; schedule soleia-weekly-report by hand.';
  end if;

  perform cron.schedule(
    'soleia-weekly-report',
    '0 14 * * 1',
    format(
      $job$
      SELECT net.http_post(
        url := 'https://rszawchsbpsmtrtvljta.supabase.co/functions/v1/weekly-report',
        headers := %L::jsonb,
        body := '{}'::jsonb,
        timeout_milliseconds := 90000
      ) AS request_id;
      $job$,
      json_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || bearer)::text
    )
  );
end
$sched$;