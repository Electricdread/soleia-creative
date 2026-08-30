-- The Drive watcher calls 17+ folder trees and retries transient Google API
-- failures, but pg_net was using its 5,000 ms default. Production therefore
-- cancelled every run before the function could finish, even while the edge
-- function itself was healthy.
--
-- Keep the existing URL, headers, schedule, job name, and credentials exactly
-- as production configured them. Only add/replace pg_net's request timeout.
-- Ninety seconds is deliberately below the two-minute schedule interval, so a
-- slow run cannot overlap the next invocation.

do $$
declare
  watcher record;
  repaired_command text;
begin
  for watcher in
    select jobid, command
      from cron.job
     where command ilike '%/functions/v1/drive-upload-watcher%'
  loop
    if watcher.command ~* 'timeout_milliseconds\s*:=' then
      repaired_command := regexp_replace(
        watcher.command,
        'timeout_milliseconds\s*:=\s*[0-9]+',
        'timeout_milliseconds := 90000',
        'i'
      );
    else
      repaired_command := regexp_replace(
        watcher.command,
        '\);[[:space:]]*$',
        E',\n    timeout_milliseconds := 90000\n  );',
        'i'
      );
    end if;

    if repaired_command = watcher.command then
      raise exception 'Could not add a timeout to Drive watcher cron job %', watcher.jobid;
    end if;

    perform cron.alter_job(
      job_id := watcher.jobid,
      command := repaired_command
    );
  end loop;
end $$;
