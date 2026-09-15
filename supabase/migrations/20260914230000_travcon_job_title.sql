-- 2026-09-14, owner: "I also see in jobs that Travcon event is not labeled correctly". The job read
-- "CR - Travcon 2026" while its packet, the record a job takes its name from (syncJobIdentity), already reads
-- "09.15.26 CR - Travcon 2026". The job had not been re-synced since. It takes the packet's name, which is what the
-- next packet save would set. Data-only correction, applied the same day through Lovable; kept here for the record.
-- Idempotent.
update public.jobs
   set title      = '09.15.26 CR - Travcon 2026',
       updated_at = now()
 where id = 'cc0f5167-10b5-4e4b-8f32-6ab6ef769c99'
   and title = 'CR - Travcon 2026';
