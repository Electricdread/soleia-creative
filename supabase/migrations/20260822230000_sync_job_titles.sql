-- One name per job, applied to the jobs that already exist.
--
-- A job's title was chosen when its first record was saved and never revisited,
-- so the Jobs screen said "MRI" while the packet said "CN - MRI Software" and
-- the session said "10.19.26 MRI Software". Twenty-two of the twenty-five jobs
-- were carrying a name none of their own records used.
--
-- The job takes the name of its records, in the order those records are raised:
-- packet, then proposal, then creative session, newest edit first within a kind.
-- A job with nothing attached keeps the name it has. `src/lib/jobTitle.ts` holds
-- the same rule for everything saved from here on, so this is a one-off
-- catch-up rather than a mechanism.

with canonical as (
  select
    j.id,
    coalesce(
      (select p.title
         from public.pre_call_packets p
        where p.job_id = j.id and coalesce(btrim(p.title), '') <> ''
        order by p.updated_at desc nulls last
        limit 1),
      (select pr.event_name
         from public.proposals pr
        where pr.job_id = j.id and coalesce(btrim(pr.event_name), '') <> ''
        order by pr.updated_at desc nulls last
        limit 1),
      (select cs.project_name
         from public.creative_sessions cs
        where cs.job_id = j.id and coalesce(btrim(cs.project_name), '') <> ''
        order by cs.updated_at desc nulls last
        limit 1),
      j.title
    ) as title
  from public.jobs j
)
update public.jobs j
   set title = btrim(c.title)
  from canonical c
 where c.id = j.id
   and btrim(c.title) is distinct from j.title;
