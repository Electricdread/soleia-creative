-- 2026-09-14, owner: "For Ncan the correct folder is labeled correctly. So the one in question can be removed".
-- The creative session "10.05.26 NCAN Opening Reception" (token creative-mtt46oql-5lueor, created 2026-09-08) sat
-- on the Vanderpump job (06.11.26), not on the NCAN job. It held only a generated cover: no notes, no brief, and it
-- was never made public. Removed the reversible way rather than deleted: archived and detached from the job, so it
-- can be restored. Data-only correction, applied the same day through Lovable; kept here for the record.
-- Idempotent.
update public.creative_sessions
   set is_active  = false,
       job_id     = null,
       updated_at = now()
 where id = '4d526f7f-8c5d-4a50-9ccb-7af8832b09a7'
   and job_id = 'd3d63fa2-7973-dcb9-698a-2b24e5cc9837';
