-- 2026-09-14, owner: "Fix and archive". Data-only correction, applied the same day through Lovable; kept here for
-- the record. Idempotent.

-- 1. Five archived jobs (GainSight, Vanderpump, Transperfect, 4th of July, Fudale x Github) held Drive folder ids
--    cut to 5 characters ("1V8Pu"), with URLs cut the same way, so the job's own link to its folder was dead. Each
--    one's proposal holds the full id, which starts with the cut one; the job takes the proposal's id and URL.
update public.jobs j
   set drive_folder_id  = r.drive_folder_id,
       drive_folder_url = r.drive_folder_url,
       updated_at       = now()
  from public.proposals r
 where r.job_id = j.id
   and length(j.drive_folder_id) < 20
   and length(r.drive_folder_id) >= 20
   and r.drive_folder_id like j.drive_folder_id || '%';

-- 2. Archive the two past shows still marked active, whose Drive folders moved into Soleia Clients / Archive that
--    night: 08.25.26 World Wide Technology and 09.05.26 LABOR DAY. The job only: each has just a pre-call packet,
--    and a packet's is_active is its "Deployed" switch (the client's link), so the packets are left as they are.
update public.jobs
   set is_active  = false,
       updated_at = now()
 where id in ('10448cbd-3504-4f35-9c58-8a93ee175a75', '81386653-d603-ef42-a7c2-849b5a922d29')
   and is_active
   and event_date <= '2026-09-07';
